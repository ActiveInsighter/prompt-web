# Prompt Web / Prompt Library MCP

基于 Cloudflare Worker、D1 和 KV 的远程提示词文件库，可供 ChatGPT 自定义 MCP 应用、Codex 及其他支持 Streamable HTTP 的 MCP 客户端查询。

## 架构

- **Cloudflare Worker**：统一 HTTP、MCP、鉴权、内容同步与业务入口。
- **D1**：主查询数据库，使用“项目 → 无限层目录 → 文件”组织提示词。
- **D1 FTS5**：搜索标题、文件名、路径、说明、正文和标签，并使用 `LIKE` 补充中文子串匹配。
- **KV**：只保存少量版本化的会话基础上下文和可按精确 key 读取的公共提示词，不参与普通模糊搜索。
- **content/**：仓库管理内容的唯一真源；合并到 `main` 后自动增量同步到 D1。

## D1 数据模型

```text
projects
  └── nodes (folder/file，自引用 parent_id)
        └── prompt_files
              ├── prompt_file_versions
              ├── file_tags ── tags
              └── prompt_search_documents ── prompt_search_fts

content_sync_runs
content_sync_entries
```

旧 `prompts` 表会在 `0002_create_project_file_tree.sql` 中自动迁移到默认项目 `prompt-library`。`0003_create_content_sync.sql` 记录仓库内容同步运行和受管理实体。

文件可通过 URI 标识：

```text
prompt://prompt-library/guides/content-sync.md
```

## content/ 目录规范

```text
content/
└── prompt-library/              # 一级目录对应一个项目
    ├── _project.yaml            # 项目配置，必须存在
    ├── guides/
    │   ├── _folder.yaml         # 可选目录配置
    │   └── content-sync.md      # 文件节点 + prompt_files
    └── templates/
        └── structured-explainer.md
```

支持 `.md`、`.txt` 和 `.json`。Markdown 可以使用 YAML Front Matter：

```yaml
---
id: stable-file-id
title: 文件标题
description: 文件说明
language: zh-CN
role: template
visibility: public
tags: [学习, 讲解]
variables: [topic]
sort: 100
metadata:
  maintained_by: repository
---
```

项目和重要文件应显式指定稳定 `id`，这样移动或重命名时可以保留版本历史。未指定时，扫描器根据项目 ID 与路径生成确定性 ID。

## Python 内容工具

需要 Python 3.13：

```bash
python -m pip install -r scripts/requirements.txt
python -m scripts.cli validate
python -m scripts.cli build
```

常用命令：

```bash
python -m scripts.cli collect http_markdown --config scripts/configs/example.yaml
python -m scripts.cli plan --base-url https://example.workers.dev
python -m scripts.cli sync --base-url https://example.workers.dev --prune
python -m scripts.cli snapshot --base-url https://example.workers.dev
```

`collectors/` 只负责把外部内容原子写入 `content/`，不直接连接 D1。`library/` 负责扫描、Front Matter、路径、哈希和 Manifest；`sync/` 只调用受保护的 Worker API。

Manifest 在本地按照 Worker 接口限制进行校验，包括路径、标题、说明、正文、标签和变量数量。这样不兼容的数据会在 PR CI 中失败，而不是等生产同步时才发现。

删除默认是关闭的。只有项目设置 `sync.prune: true`，并且同步命令显式传入 `--prune` 时，数据库中由 `content_sync_entries` 管理且本地已消失的节点才会被软删除。

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

公共读取：

- `GET /health`
- `GET /api/projects`
- `GET /api/tree?project=prompt-library&path=/guides`
- `GET /api/files/search?q=sync&project=prompt-library`
- `GET /api/files/fetch?identifier=prompt-library-content-sync-guide`
- `GET /api/bootstrap/chatgpt/default`
- `POST /mcp`

内容发布接口：

- `GET /api/admin/library/snapshot`
- `POST /api/admin/library/sync`

内容发布接口使用独立的 `CONTENT_SYNC_TOKEN` Bearer Token，不复用 MCP 私有读取令牌。生产工作流每次部署都会生成并轮换该令牌。为避免 Cloudflare Secret 版本传播期间使用旧令牌，工作流会先建立 Worker、写入 Secret，再执行一次最终部署后同步 Manifest；客户端仍会对短暂的 401 传播窗口做有限重试。

## 本地开发与检查

需要 Node.js 24 和 Python 3.13。

```bash
npm install
python -m pip install -r scripts/requirements.txt
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run kv:seed -- --local
npm run project:ci
npm run dev
```

完整检查包括：

1. TypeScript 类型检查；
2. 全部本地 D1 migrations；
3. content 目录校验和 Manifest 生成；
4. Python 单元测试；
5. 既有运行状态测试；
6. Wrangler Worker dry run。

## GitHub Actions 与生产发布

### Secrets

| 名称 | 必需 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | 是 | GitHub Actions 调用 Cloudflare API |
| `CLOUDFLARE_ACCOUNT_ID` | 是 | Cloudflare Account ID |
| `MCP_BEARER_TOKEN` | 否 | 读取 private 文件 |

`CONTENT_SYNC_TOKEN` 不需要预先配置。部署工作流会生成随机值、写入 Worker Secret、执行最终部署与同步，然后在下一次部署时轮换。

### Variables

| 名称 | 必需 | 示例 |
| --- | --- | --- |
| `D1_DATABASE_ID` | 是 | D1 创建命令返回的 UUID |
| `KV_NAMESPACE_ID` | 是 | KV 创建命令返回的 32 位 ID |
| `D1_DATABASE_NAME` | 否 | `prompt-web-db` |
| `CLOUDFLARE_WORKER_NAME` | 否 | `prompt-mcp` |

合并进入 `main` 后，生产工作流依次执行：

```text
内容校验与 Manifest
→ TypeScript
→ 本地迁移验证
→ 远程 D1 migrations
→ 远程 KV 种子
→ Worker 引导部署
→ 轮换并上传 MCP / CONTENT_SYNC Secret
→ Worker 最终部署（固定新 Secret）
→ content/ 增量同步
→ health / search / fetch 冒烟测试
```

## ChatGPT / Codex

远程 MCP URL：

```text
https://<worker-name>.<your-subdomain>.workers.dev/mcp
```

公共读取可先无认证连接。正式向 ChatGPT 暴露私有项目时应继续增加 OAuth；当前 Bearer Token 主要用于开发测试、Codex 和支持自定义请求头的 MCP 客户端。

## 迁移约定

新增 schema 变更时创建递增迁移文件，不修改已经部署的迁移。KV 种子采用 Wrangler bulk put 格式，修改 `seed/kv-prompts.json` 后在下一次生产部署同步。
