---
title: mask-clip
description: Utilities for controlling the bounding box of an element's mask.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 60
metadata:
  source: https://tailwindcss.com/docs/mask-clip
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mask-clip

Utilities for controlling the bounding box of an element's mask.

| Class | Styles |
| --- | --- |
| `mask-clip-border` | `mask-clip: border-box;` |
| `mask-clip-padding` | `mask-clip: padding-box;` |
| `mask-clip-content` | `mask-clip: content-box;` |
| `mask-clip-fill` | `mask-clip: fill-box;` |
| `mask-clip-stroke` | `mask-clip: stroke-box;` |
| `mask-clip-view` | `mask-clip: view-box;` |
| `mask-no-clip` | `mask-clip: no-clip;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `mask-clip-border`, `mask-clip-padding`, and `mask-clip-content` to control the bounding box of an element's mask:

```
<div class="mask-clip-border border-3 p-1.5 mask-[url(/img/circle.png)] bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-clip-padding border-3 p-1.5 mask-[url(/img/circle.png)] bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-clip-content border-3 p-1.5 mask-[url(/img/circle.png)] bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Responsive design](#responsive-design)

Prefix a `mask-clip` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mask-clip-border md:mask-clip-padding ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
