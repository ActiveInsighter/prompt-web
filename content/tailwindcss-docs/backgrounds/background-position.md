---
title: background-position
description: Utilities for controlling the position of an element's background image.
language: en-US
role: reference
tags:
- tailwindcss
- backgrounds
sort: 60
metadata:
  source: https://tailwindcss.com/docs/background-position
  sidebar_group: Backgrounds
  section: Backgrounds
  collector: rendered-html
---

# background-position

Utilities for controlling the position of an element's background image.

| Class | Styles |
| --- | --- |
| `bg-top-left` | `background-position: top left;` |
| `bg-top` | `background-position: top;` |
| `bg-top-right` | `background-position: top right;` |
| `bg-left` | `background-position: left;` |
| `bg-center` | `background-position: center;` |
| `bg-right` | `background-position: right;` |
| `bg-bottom-left` | `background-position: bottom left;` |
| `bg-bottom` | `background-position: bottom;` |
| `bg-bottom-right` | `background-position: bottom right;` |
| `bg-position-(<custom-property>)` | `background-position: var(<custom-property>);` |
| `bg-position-[<value>]` | `background-position: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `bg-center`, `bg-right`, and `bg-top-left` to control the position of an element's background image:

Hover over these examples to see the full image

```
<div class="bg-[url(/img/mountains.jpg)] bg-top-left"></div><div class="bg-[url(/img/mountains.jpg)] bg-top"></div><div class="bg-[url(/img/mountains.jpg)] bg-top-right"></div><div class="bg-[url(/img/mountains.jpg)] bg-left"></div><div class="bg-[url(/img/mountains.jpg)] bg-center"></div><div class="bg-[url(/img/mountains.jpg)] bg-right"></div><div class="bg-[url(/img/mountains.jpg)] bg-bottom-left"></div><div class="bg-[url(/img/mountains.jpg)] bg-bottom"></div><div class="bg-[url(/img/mountains.jpg)] bg-bottom-right"></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `bg-position-[<value>]` syntax to set the background position based on a completely custom value:

```
<div class="bg-position-[center_top_1rem] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `bg-position-(<custom-property>)` syntax:

```
<div class="bg-position-(--my-bg-position) ...">  <!-- ... --></div>
```

This is just a shorthand for `bg-position-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `background-position` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="bg-center md:bg-top ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
