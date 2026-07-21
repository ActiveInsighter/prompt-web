---
title: break-inside
description: Utilities for controlling how a column or page should break within an
  element.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 50
metadata:
  source: https://tailwindcss.com/docs/break-inside
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# break-inside

Utilities for controlling how a column or page should break within an element.

| Class | Styles |
| --- | --- |
| `break-inside-auto` | `break-inside: auto;` |
| `break-inside-avoid` | `break-inside: avoid;` |
| `break-inside-avoid-page` | `break-inside: avoid-page;` |
| `break-inside-avoid-column` | `break-inside: avoid-column;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `break-inside-column` and `break-inside-avoid-page` to control how a column or page break should behave within an element:

```
<div class="columns-2">  <p>Well, let me tell you something, ...</p>  <p class="break-inside-avoid-column">Sure, go ahead, laugh...</p>  <p>Maybe we can live without...</p>  <p>Look. If you think this is...</p></div>
```

### [Responsive design](#responsive-design)

Prefix a `break-inside` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="break-inside-avoid-column md:break-inside-auto ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
