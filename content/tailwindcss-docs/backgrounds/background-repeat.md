---
title: background-repeat
description: Utilities for controlling the repetition of an element's background image.
language: en-US
role: reference
tags:
- tailwindcss
- backgrounds
sort: 70
metadata:
  source: https://tailwindcss.com/docs/background-repeat
  sidebar_group: Backgrounds
  section: Backgrounds
  collector: rendered-html
---

# background-repeat

Utilities for controlling the repetition of an element's background image.

| Class | Styles |
| --- | --- |
| `bg-repeat` | `background-repeat: repeat;` |
| `bg-repeat-x` | `background-repeat: repeat-x;` |
| `bg-repeat-y` | `background-repeat: repeat-y;` |
| `bg-repeat-space` | `background-repeat: space;` |
| `bg-repeat-round` | `background-repeat: round;` |
| `bg-no-repeat` | `background-repeat: no-repeat;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `bg-repeat` utility to repeat the background image both vertically and horizontally:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-repeat ..."></div>
```

### [Repeating horizontally](#repeating-horizontally)

Use the `bg-repeat-x` utility to only repeat the background image horizontally:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-repeat-x ..."></div>
```

### [Repeating vertically](#repeating-vertically)

Use the `bg-repeat-y` utility to only repeat the background image vertically:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-repeat-y ..."></div>
```

### [Preventing clipping](#preventing-clipping)

Use the `bg-repeat-space` utility to repeat the background image without clipping:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-repeat-space ..."></div>
```

### [Preventing clipping and gaps](#preventing-clipping-and-gaps)

Use the `bg-repeat-round` utility to repeat the background image without clipping, stretching if needed to avoid gaps:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-repeat-round ..."></div>
```

### [Disabling repeating](#disabling-repeating)

Use the `bg-no-repeat` utility to prevent a background image from repeating:

```
<div class="bg-[url(/img/clouds.svg)] bg-center bg-no-repeat ..."></div>
```

### [Responsive design](#responsive-design)

Prefix a `background-repeat` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="bg-repeat md:bg-repeat-x ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
