---
title: stroke-width
description: Utilities for styling the stroke width of SVG elements.
language: en-US
role: reference
tags:
- tailwindcss
- svg
sort: 30
metadata:
  source: https://tailwindcss.com/docs/stroke-width
  sidebar_group: SVG
  section: SVG
  collector: rendered-html
---

# stroke-width

Utilities for styling the stroke width of SVG elements.

| Class | Styles |
| --- | --- |
| `stroke-<number>` | `stroke-width: <number>;` |
| `stroke-(length:<custom-property>)` | `stroke-width: var(<custom-property>);` |
| `stroke-[<value>]` | `stroke-width: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `stroke-<number>` utilities like `stroke-1` and `stroke-2` to set the stroke width of an SVG:

```
<svg class="stroke-1 ..."></svg><svg class="stroke-2 ..."></svg>
```

This can be useful for styling icon sets like [Heroicons](https://heroicons.com).

### [Using a custom value](#using-a-custom-value)

Use the `stroke-[<value>]` syntax to set the stroke width based on a completely custom value:

```
<div class="stroke-[1.5] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `stroke-(length:<custom-property>)` syntax:

```
<div class="stroke-(length:--my-stroke-width) ...">  <!-- ... --></div>
```

This is just a shorthand for `stroke-[length:var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `stroke-width` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="stroke-1 md:stroke-2 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
