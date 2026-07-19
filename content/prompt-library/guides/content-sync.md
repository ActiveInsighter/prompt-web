---
id: prompt-library-content-sync-guide
title: 内容库同步使用说明
description: 说明如何把 content 目录中的项目、目录和文件自动同步到 D1，供 MCP 查询和读取。
language: zh-CN
role: reference
visibility: public
tags:
  - 内容同步
  - D1
  - MCP
sort: 100
metadata:
  maintained_by: repository
---

# 内容库同步使用说明

`content/` 是提示词和文档的内容真源。它下面的每个一级目录对应一个数据库项目，后续目录对应文件夹，Markdown、文本和 JSON 文件对应提示词文件。

修改内容后，先运行：

```bash
python -m scripts.cli validate
python -m scripts.cli build
```

合并到 `main` 后，部署工作流会应用 D1 迁移、部署 Worker、生成临时同步令牌并调用受保护的内容同步接口。同步完成后，可以通过 `search_files` 搜索，也可以通过 `fetch_file` 按文件 ID 或 `prompt://` URI 读取。

本文件的 URI 为：

```text
prompt://prompt-library/guides/content-sync.md
```
