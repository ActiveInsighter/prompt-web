---
title: mask-repeat
description: Utilities for controlling the repetition of an element's mask image.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 120
metadata:
  source: https://tailwindcss.com/docs/mask-repeat
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mask-repeat

Utilities for controlling the repetition of an element's mask image.

| Class | Styles |
| --- | --- |
| `mask-repeat` | `mask-repeat: repeat;` |
| `mask-no-repeat` | `mask-repeat: no-repeat;` |
| `mask-repeat-x` | `mask-repeat: repeat-x;` |
| `mask-repeat-y` | `mask-repeat: repeat-y;` |
| `mask-repeat-space` | `mask-repeat: space;` |
| `mask-repeat-round` | `mask-repeat: round;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `mask-repeat` utility to repeat the mask image both vertically and horizontally:

```
<div class="mask-repeat mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Repeating horizontally](#repeating-horizontally)

Use the `mask-repeat-x` utility to only repeat the mask image horizontally:

```
<div class="mask-repeat-x mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)]..."></div>
```

### [Repeating vertically](#repeating-vertically)

Use the `mask-repeat-y` utility to only repeat the mask image vertically:

```
<div class="mask-repeat-y mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)]..."></div>
```

### [Preventing clipping](#preventing-clipping)

Use the `mask-repeat-space` utility to repeat the mask image without clipping:

```
<div class="mask-repeat-space mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Preventing clipping and gaps](#preventing-clipping-and-gaps)

Use the `mask-repeat-round` utility to repeat the mask image without clipping, stretching if needed to avoid gaps:

```
<div class="mask-repeat-round mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Disabling repeating](#disabling-repeating)

Use the `mask-no-repeat` utility to prevent a mask image from repeating:

```
<div class="mask-no-repeat mask-[url(/img/circle.png)] mask-size-[50px_50px] bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Responsive design](#responsive-design)

Prefix a `mask-repeat` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mask-repeat md:mask-repeat-x ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
