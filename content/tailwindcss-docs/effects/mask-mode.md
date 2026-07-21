---
title: mask-mode
description: Utilities for controlling an element's mask mode.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 90
metadata:
  source: https://tailwindcss.com/docs/mask-mode
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mask-mode

Utilities for controlling an element's mask mode.

| Class | Styles |
| --- | --- |
| `mask-alpha` | `mask-mode: alpha;` |
| `mask-luminance` | `mask-mode: luminance;` |
| `mask-match` | `mask-mode: match-source;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `mask-alpha`, `mask-luminance` and `mask-match` utilities to control the mode of an element's mask:

```
<div class="mask-alpha mask-r-from-black mask-r-from-50% mask-r-to-transparent bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-luminance mask-r-from-white mask-r-from-50% mask-r-to-black bg-[url(/img/mountains.jpg)] ..."></div>
```

When using `mask-luminance` the luminance value of the mask determines visibility, so sticking with grayscale colors will produce the most predictable results. With `mask-alpha`, the opacity of the mask determines the visibility of the masked element.

### [Responsive design](#responsive-design)

Prefix a `mask-mode` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mask-alpha md:mask-luminance ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
