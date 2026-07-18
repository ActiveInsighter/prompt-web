# prompt-web

Prompt Web 项目。

## GitHub Actions 构建可观测性

仓库会自动维护以下文件：

- `.github/latest-run-id.txt`：最近一次主分支 CI 的 run ID。
- `.github/latest-run-url.txt`：最近一次 CI 的网页地址。
- `.github/latest-run.json`：最近一次运行的结构化状态。
- `.github/build-history.json`：最近 10 次构建记录。
- `.github/latest-build-log.txt`：项目安装、测试和构建命令的输出。
- `.github/latest-actions-log.txt`：CI 完成后自动下载的完整 GitHub Actions job 日志。

主 CI 在运行开始时先写入 run ID，结束时更新成功或失败状态。辅助工作流在主 CI 完成后自动下载完整 job 日志并提交回仓库；这些状态文件的提交不会再次触发主 CI。

## 本地查询

需要 Node.js 24，并为私有仓库提供具有 Actions 读取权限的 `GH_TOKEN` 或 `GITHUB_TOKEN`。

```bash
npm run run:latest
npm run log:latest
```

也可以指定仓库、工作流或 run ID：

```bash
node scripts/get-latest-run.mjs --repo ActiveInsighter/prompt-web --workflow ci.yml --branch main
node scripts/get-latest-run.mjs --repo ActiveInsighter/prompt-web --run-id 123456789 --logs
```

后续项目代码只需在 `package.json` 中提供 `project:ci` 脚本；否则 CI 会依次执行已有的 `typecheck`、`lint`、`test`、`build` 脚本。
