# Prompt Web / Prompt Library MCP

基于 Cloudflare Worker、D1 和 KV 的远程提示词库骨架，可供 ChatGPT 自定义 MCP 应用、Codex 及其他支持 Streamable HTTP 的 MCP 客户端查询。

## 当前架构

- **Cloudflare Worker**：统一 HTTP 入口，提供 REST API 和 `/mcp` 远程 MCP 端点。
- **D1**：保存主要提示词、可见性、分类、标签、变量、元数据和版本记录。
- **D1 FTS5**：关键词全文检索；同时使用 `LIKE` 作为子串/中文模糊匹配补充。
- **KV**：保存少量公共、初始提示词和 `index:public` 轻量索引。
- **权限模型**：匿名请求只能读取 `public`；配置 Bearer Token 后可读取 `private` 和 `system`。

## MCP 工具

- `search`：按关键词、分类、语言、标签、可见性组合查询。
- `fetch`：按 ID、slug 或 KV key 获取完整提示词。
- `render_prompt`：给 `{{variable}}` 传值并渲染提示词。
- `list_categories`：列出当前调用者可访问的分类。

## HTTP 接口

- `GET /health`
- `GET /api/prompts/search?q=代码&category=coding&tag=审查&limit=10`
- `GET /api/prompts/:identifier`
- `POST /mcp`（MCP Streamable HTTP）

私有访问请求头：

```http
Authorization: Bearer <MCP_BEARER_TOKEN>
```

## 本地开发

需要 Node.js 24。

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run kv:seed -- --local
npm run dev
```

`wrangler.jsonc` 中的 D1/KV ID 是占位符。本地模式可直接使用；连接远程资源时替换为实际 ID，或使用部署脚本生成 `wrangler.deploy.jsonc`。

## 首次创建 Cloudflare 资源

资源只需创建一次，后续部署只执行迁移、KV 种子同步和 Worker 发布。

```bash
npx wrangler login
npx wrangler d1 create prompt-web-db
npx wrangler kv namespace create PROMPT_KV
```

记录输出中的 D1 database ID 与 KV namespace ID。

## GitHub Actions 配置

仓库保留原有 PR/main CI，并新增 `.github/workflows/deploy-worker.yml`：

1. 功能分支和 PR 只运行检查，不部署。
2. PR 合并进入 `main` 后自动触发生产部署。
3. 先应用 D1 migrations。
4. 再同步 `seed/kv-prompts.json`。
5. 最后部署 Worker，并按需写入私有访问 Token。

### GitHub Actions Secrets

| 名称 | 必需 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 是 | GitHub Actions 调用 Cloudflare API |
| `CLOUDFLARE_ACCOUNT_ID` | 是 | Cloudflare Account ID |
| `MCP_BEARER_TOKEN` | 否 | 访问 private/system 提示词；不设置时只有公共读取 |

建议 API Token 至少包含：Workers Scripts Edit、Workers KV Storage Edit、D1 Edit、Account Settings Read。绑定自定义域名/Route 时再增加 Workers Routes Edit。

### GitHub Actions Variables

| 名称 | 必需 | 示例 |
| --- | --- | --- |
| `D1_DATABASE_ID` | 是 | D1 创建命令返回的 UUID |
| `KV_NAMESPACE_ID` | 是 | KV 创建命令返回的 32 位 ID |
| `D1_DATABASE_NAME` | 否 | `prompt-web-db` |
| `CLOUDFLARE_WORKER_NAME` | 否 | `prompt-mcp` |

## ChatGPT 连接

部署后，将远程 MCP URL 设置为：

```text
https://<worker-name>.<your-subdomain>.workers.dev/mcp
```

公共提示词可以先使用无认证连接。ChatGPT 中需要私有提示词时，正式方案应增加 OAuth；当前 Bearer Token 方案主要用于 Codex、开发测试和支持自定义请求头的 MCP 客户端。

## Codex / 其他 MCP 客户端

将上面的 `/mcp` URL 作为远程 Streamable HTTP MCP Server。公共模式不需要认证；私有模式发送：

```text
Authorization: Bearer <MCP_BEARER_TOKEN>
```

具体配置字段以所用 Codex 客户端版本的 MCP 配置入口为准。

## 数据写入约定

D1 的 `tags_text` 使用逗号分隔，`variables_json` 使用 JSON 数组，`metadata_json` 使用 JSON 对象。新增 schema 变更时创建递增迁移文件，不直接修改已部署迁移。

KV 种子采用 Wrangler bulk put 格式。修改 `seed/kv-prompts.json` 后，下一次合并到 `main` 会自动同步。

## GitHub Actions 构建可观测性

仓库原有运行状态与日志文件继续保留：

- `.github/latest-run-id.txt`
- `.github/latest-run-url.txt`
- `.github/latest-run.json`
- `.github/build-history.json`
- `.github/latest-build-log.txt`
- `.github/latest-actions-log.txt`
