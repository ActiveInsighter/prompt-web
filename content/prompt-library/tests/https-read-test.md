---
id: prompt-library-https-read-test
title: HTTPS 接口读取测试
description: 用于验证仓库 Markdown 能否自动同步到 D1，并通过公开 HTTPS 接口读取。
language: zh-CN
role: reference
visibility: public
tags:
  - HTTPS
  - 接口测试
  - D1
sort: 900
metadata:
  maintained_by: repository
  purpose: production-read-test
---

# HTTPS 接口读取测试

这是一份由 `content/` 自动同步到 Cloudflare D1 的公开 Markdown 测试文件。

唯一校验字符串：

```text
PROMPT-WEB-HTTPS-READ-TEST-20260719-001
```

能够通过 HTTPS 接口看到这段内容，说明以下链路工作正常：

```text
GitHub content/ → Manifest → Worker 同步接口 → D1 → HTTPS 读取接口
```

测试文件的 MCP URI：

```text
prompt://prompt-library/tests/https-read-test.md
```
