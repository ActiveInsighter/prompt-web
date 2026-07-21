---
title: mix-blend-mode
description: Utilities for controlling how an element should blend with the background.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 40
metadata:
  source: https://tailwindcss.com/docs/mix-blend-mode
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mix-blend-mode

Utilities for controlling how an element should blend with the background.

| Class | Styles |
| --- | --- |
| `mix-blend-normal` | `mix-blend-mode: normal;` |
| `mix-blend-multiply` | `mix-blend-mode: multiply;` |
| `mix-blend-screen` | `mix-blend-mode: screen;` |
| `mix-blend-overlay` | `mix-blend-mode: overlay;` |
| `mix-blend-darken` | `mix-blend-mode: darken;` |
| `mix-blend-lighten` | `mix-blend-mode: lighten;` |
| `mix-blend-color-dodge` | `mix-blend-mode: color-dodge;` |
| `mix-blend-color-burn` | `mix-blend-mode: color-burn;` |
| `mix-blend-hard-light` | `mix-blend-mode: hard-light;` |
| `mix-blend-soft-light` | `mix-blend-mode: soft-light;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `mix-blend-overlay` and `mix-blend-soft-light` to control how an element's content and background is blended with other content in the same stacking context:

```
<div class="flex justify-center -space-x-14">  <div class="bg-blue-500 mix-blend-multiply ..."></div>  <div class="bg-pink-500 mix-blend-multiply ..."></div></div>
```

### [Isolating blending](#isolating-blending)

Use the `isolate` utility on the parent element to create a new stacking context and prevent blending with content behind it:

```
<div class="isolate flex justify-center -space-x-14">  <div class="bg-yellow-500 mix-blend-multiply ..."></div>  <div class="bg-green-500 mix-blend-multiply ..."></div></div><div class="flex justify-center -space-x-14">  <div class="bg-yellow-500 mix-blend-multiply ..."></div>  <div class="bg-green-500 mix-blend-multiply ..."></div></div>
```

### [Responsive design](#responsive-design)

Prefix a `mix-blend-mode` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mix-blend-multiply md:mix-blend-overlay ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
