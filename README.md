# Prompt Web / Prompt Library MCP

基于 Cloudflare Worker、D1 和 KV 的远程提示词文件库，可供 ChatGPT 自定义 MCP 应用、Codex 及其他支持 Streamable HTTP 的 MCP 客户端查询。

## 架构

- **Cloudflare Worker**：统一 HTTP、MCP、鉴权与业务入口。
- **D1**：主数据源，使用“项目 → 无限层目录 → 文件”组织提示词。
- **D1 FTS5**：搜索标题、文件名、路径、说明、正文和标签，并使用 `LIKE` 补充中文子串匹配。
- **KV**：只保存少量版本化的会话基础上下文和可按精确 key 读取的公共提示词，不参与普通模糊搜索。
- **权限**：匿名只能读取 `public`；Bearer Token 可读取 `private`。提示词角色通过 `prompt_role` 单独表示。

## D1 数据模型

```text
projects
  └── nodes (folder/file，自引用 parent_id)
        └── prompt_files
              ├── prompt_file_versions
              ├── file_tags ── tags
              └── prompt_search_documents ── prompt_search_fts
```

旧 `prompts` 表会在 `0002_create_project_file_tree.sql` 中自动迁移到默认项目 `prompt-library`，旧表暂时保留用于兼容和回滚。

文件可通过 URI 标识：

```text
prompt://prompt-library/general/structured-explainer.md
```

## MCP 工具

- `list_projects`：列出可访问项目。
- `list_directory`：列出目录的直接子节点。
- `search_files`：按关键词、项目、目录、标签、语言、权限和提示词角色查询 D1 文件。
- `fetch_file`：按文件 ID、`prompt://` URI、`project:/path` 或兼容路径读取完整文件。
- `fetch_files`：一次读取最多 10 个文件。
- `render_prompt`：为 D1 文件中的 `{{variable}}` 传值。
- `get_bootstrap_context`：从 KV 读取版本化会话基础上下文。
- `get_common_prompt`：按精确 `common:*` key 读取公共提示词。
- `search`、`fetch`、`list_categories`：保留的旧客户端兼容别名。

## HTTP 接口

- `GET /health`
- `GET /api/projects`
- `GET /api/tree?project=prompt-library&path=/general`
- `GET /api/files/search?q=代码&project=prompt-library&directory=/coding`
- `GET /api/files/fetch?identifier=prompt://prompt-library/coding/code-review.md`
- `GET /api/bootstrap/chatgpt/default`
- `POST /mcp`（MCP Streamable HTTP）

私有访问请求头：

```http
Authorization: Bearer <MCP_BEARER_TOKEN>
```

## KV 键约定

```text
manifest:bootstrap:<client>:<profile>
bundle:<client>:<profile>:v<version>
common:<name>:v<version>
index:common
```

Bundle 使用不可变版本 key，部署或回滚 Worker 时不会依赖被覆盖的同名 KV 值。

## 本地开发

需要 Node.js 24。

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run kv:seed -- --local
npm run dev
```

运行完整检查：

```bash
npm run project:ci
```

完整检查会依次执行 TypeScript 类型检查、本地 D1 migrations 和现有测试。

## 首次创建 Cloudflare 资源

```bash
npx wrangler login
npx wrangler d1 create prompt-web-db
npx wrangler kv namespace create PROMPT_KV
```

记录 D1 database ID 与 KV namespace ID，并配置 GitHub Actions。

### GitHub Actions Secrets

| 名称 | 必需 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 是 | GitHub Actions 调用 Cloudflare API |
| `CLOUDFLARE_ACCOUNT_ID` | 是 | Cloudflare Account ID |
| `MCP_BEARER_TOKEN` | 否 | 访问 private 文件；不设置时只有公共读取 |

### GitHub Actions Variables

| 名称 | 必需 | 示例 |
| --- | --- | --- |
| `D1_DATABASE_ID` | 是 | D1 创建命令返回的 UUID |
| `KV_NAMESPACE_ID` | 是 | KV 创建命令返回的 32 位 ID |
| `D1_DATABASE_NAME` | 否 | `prompt-web-db` |
| `CLOUDFLARE_WORKER_NAME` | 否 | `prompt-mcp` |

合并进入 `main` 后，部署工作流会依次执行类型检查、本地迁移验证、远程 D1 迁移、KV 种子同步和 Worker 发布。

## ChatGPT / Codex

远程 MCP URL：

```text
https://<worker-name>.<your-subdomain>.workers.dev/mcp
```

公共读取可先无认证连接。正式向 ChatGPT 暴露私有项目时应继续增加 OAuth；当前 Bearer Token 主要用于开发测试、Codex 和支持自定义请求头的 MCP 客户端。

## 迁移约定

新增 schema 变更时创建递增迁移文件，不修改已经部署的迁移。KV 种子采用 Wrangler bulk put 格式，修改 `seed/kv-prompts.json` 后在下一次生产部署同步。
