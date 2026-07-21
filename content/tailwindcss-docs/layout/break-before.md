---
title: break-before
description: Utilities for controlling how a column or page should break before an
  element.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 40
metadata:
  source: https://tailwindcss.com/docs/break-before
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# break-before

Utilities for controlling how a column or page should break before an element.

| Class | Styles |
| --- | --- |
| `break-before-auto` | `break-before: auto;` |
| `break-before-avoid` | `break-before: avoid;` |
| `break-before-all` | `break-before: all;` |
| `break-before-avoid-page` | `break-before: avoid-page;` |
| `break-before-page` | `break-before: page;` |
| `break-before-left` | `break-before: left;` |
| `break-before-right` | `break-before: right;` |
| `break-before-column` | `break-before: column;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `break-before-column` and `break-before-page` to control how a column or page break should behave before an element:

```
<div class="columns-2">  <p>Well, let me tell you something, ...</p>  <p class="break-before-column">Sure, go ahead, laugh...</p>  <p>Maybe we can live without...</p>  <p>Look. If you think this is...</p></div>
```

### [Responsive design](#responsive-design)

Prefix a `break-before` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="break-before-column md:break-before-auto ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
