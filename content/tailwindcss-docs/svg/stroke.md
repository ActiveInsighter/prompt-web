---
title: stroke
description: Utilities for styling the stroke of SVG elements.
language: en-US
role: reference
tags:
- tailwindcss
- svg
sort: 20
metadata:
  source: https://tailwindcss.com/docs/stroke
  sidebar_group: SVG
  section: SVG
  collector: rendered-html
---

# stroke

Utilities for styling the stroke of SVG elements.

| Class | Styles |
| --- | --- |
| `stroke-none` | `stroke: none;` |
| `stroke-inherit` | `stroke: inherit;` |
| `stroke-current` | `stroke: currentColor;` |
| `stroke-transparent` | `stroke: transparent;` |
| `stroke-black` | `stroke: var(--color-black); /* #000 */` |
| `stroke-white` | `stroke: var(--color-white); /* #fff */` |
| `stroke-red-50` | `stroke: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */` |
| `stroke-red-100` | `stroke: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */` |
| `stroke-red-200` | `stroke: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */` |
| `stroke-red-300` | `stroke: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `stroke-indigo-500` and `stroke-lime-600` to change the stroke color of an SVG:

```
<svg class="stroke-cyan-500 ...">  <!-- ... --></svg>
```

This can be useful for styling icon sets like [Heroicons](https://heroicons.com).

### [Using the current color](#using-the-current-color)

Use the `stroke-current` utility to set the stroke color to the current text color:

Hover over the button to see the stroke color change

```
<button class="bg-white text-pink-600 hover:bg-pink-600 hover:text-white ...">  <svg class="size-5 stroke-current ..." fill="none">    <!-- ... -->  </svg>  Download file</button>
```

### [Using a custom value](#using-a-custom-value)

Use the `stroke-[<value>]` syntax to set the stroke color based on a completely custom value:

```
<svg class="stroke-[#243c5a] ...">  <!-- ... --></svg>
```

For CSS variables, you can also use the `stroke-(<custom-property>)` syntax:

```
<svg class="stroke-(--my-stroke-color) ...">  <!-- ... --></svg>
```

This is just a shorthand for `stroke-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `stroke` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<svg class="stroke-cyan-500 md:stroke-cyan-700 ...">  <!-- ... --></svg>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `stroke-regal-blue` utility can be used in your markup:

```
<svg class="stroke-regal-blue">  <!-- ... --></svg>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
