---
title: break-after
description: Utilities for controlling how a column or page should break after an
  element.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 30
metadata:
  source: https://tailwindcss.com/docs/break-after
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# break-after

Utilities for controlling how a column or page should break after an element.

| Class | Styles |
| --- | --- |
| `break-after-auto` | `break-after: auto;` |
| `break-after-avoid` | `break-after: avoid;` |
| `break-after-all` | `break-after: all;` |
| `break-after-avoid-page` | `break-after: avoid-page;` |
| `break-after-page` | `break-after: page;` |
| `break-after-left` | `break-after: left;` |
| `break-after-right` | `break-after: right;` |
| `break-after-column` | `break-after: column;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `break-after-column` and `break-after-page` to control how a column or page break should behave after an element:

```
<div class="columns-2">  <p>Well, let me tell you something, ...</p>  <p class="break-after-column">Sure, go ahead, laugh...</p>  <p>Maybe we can live without...</p>  <p>Look. If you think this is...</p></div>
```

### [Responsive design](#responsive-design)

Prefix a `break-after` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="break-after-column md:break-after-auto ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
