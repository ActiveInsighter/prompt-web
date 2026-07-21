---
title: background-blend-mode
description: Utilities for controlling how an element's background image should blend
  with its background color.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 50
metadata:
  source: https://tailwindcss.com/docs/background-blend-mode
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# background-blend-mode

Utilities for controlling how an element's background image should blend with its background color.

| Class | Styles |
| --- | --- |
| `bg-blend-normal` | `background-blend-mode: normal;` |
| `bg-blend-multiply` | `background-blend-mode: multiply;` |
| `bg-blend-screen` | `background-blend-mode: screen;` |
| `bg-blend-overlay` | `background-blend-mode: overlay;` |
| `bg-blend-darken` | `background-blend-mode: darken;` |
| `bg-blend-lighten` | `background-blend-mode: lighten;` |
| `bg-blend-color-dodge` | `background-blend-mode: color-dodge;` |
| `bg-blend-color-burn` | `background-blend-mode: color-burn;` |
| `bg-blend-hard-light` | `background-blend-mode: hard-light;` |
| `bg-blend-soft-light` | `background-blend-mode: soft-light;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `bg-blend-difference` and `bg-blend-saturation` to control how the background image and color of an element are blended:

```
<div class="bg-blue-500 bg-[url(/img/mountains.jpg)] bg-blend-multiply ..."></div><div class="bg-blue-500 bg-[url(/img/mountains.jpg)] bg-blend-soft-light ..."></div><div class="bg-blue-500 bg-[url(/img/mountains.jpg)] bg-blend-overlay ..."></div>
```

### [Responsive design](#responsive-design)

Prefix a `background-blend-mode` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="bg-blue-500 bg-[url(/img/mountains.jpg)] bg-blend-lighten md:bg-blend-darken ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
