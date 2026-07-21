---
title: box-decoration-break
description: Utilities for controlling how element fragments should be rendered across
  multiple lines, columns, or pages.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 60
metadata:
  source: https://tailwindcss.com/docs/box-decoration-break
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# box-decoration-break

Utilities for controlling how element fragments should be rendered across multiple lines, columns, or pages.

| Class | Styles |
| --- | --- |
| `box-decoration-clone` | `box-decoration-break: clone;` |
| `box-decoration-slice` | `box-decoration-break: slice;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `box-decoration-slice` and `box-decoration-clone` utilities to control whether properties like background, border, border-image, box-shadow, clip-path, margin, and padding should be rendered as if the element were one continuous fragment, or distinct blocks:

```
<span class="box-decoration-slice bg-linear-to-r from-indigo-600 to-pink-500 px-2 text-white ...">  Hello<br />World</span><span class="box-decoration-clone bg-linear-to-r from-indigo-600 to-pink-500 px-2 text-white ...">  Hello<br />World</span>
```

### [Responsive design](#responsive-design)

Prefix a `box-decoration-break` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="box-decoration-clone md:box-decoration-slice ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
