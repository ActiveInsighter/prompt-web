---
title: fill
description: Utilities for styling the fill of SVG elements.
language: en-US
role: reference
tags:
- tailwindcss
- svg
sort: 10
metadata:
  source: https://tailwindcss.com/docs/fill
  sidebar_group: SVG
  section: SVG
  collector: rendered-html
---

# fill

Utilities for styling the fill of SVG elements.

| Class | Styles |
| --- | --- |
| `fill-none` | `fill: none;` |
| `fill-inherit` | `fill: inherit;` |
| `fill-current` | `fill: currentColor;` |
| `fill-transparent` | `fill: transparent;` |
| `fill-black` | `fill: var(--color-black); /* #000 */` |
| `fill-white` | `fill: var(--color-white); /* #fff */` |
| `fill-red-50` | `fill: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */` |
| `fill-red-100` | `fill: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */` |
| `fill-red-200` | `fill: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */` |
| `fill-red-300` | `fill: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `fill-indigo-500` and `fill-lime-600` to change the fill color of an SVG:

```
<svg class="fill-blue-500 ...">  <!-- ... --></svg>
```

This can be useful for styling icon sets like [Heroicons](https://heroicons.com).

### [Using the current color](#using-the-current-color)

Use the `fill-current` utility to set the fill color to the current text color:

Hover over the button to see the fill color change

```
<button class="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white ...">  <svg class="size-5 fill-current ...">    <!-- ... -->  </svg>  Check for updates</button>
```

### [Using a custom value](#using-a-custom-value)

Use the `fill-[<value>]` syntax to set the fill color based on a completely custom value:

```
<svg class="fill-[#243c5a] ...">  <!-- ... --></svg>
```

For CSS variables, you can also use the `fill-(<custom-property>)` syntax:

```
<svg class="fill-(--my-fill-color) ...">  <!-- ... --></svg>
```

This is just a shorthand for `fill-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `fill` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<svg class="fill-cyan-500 md:fill-cyan-700 ...">  <!-- ... --></svg>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `fill-regal-blue` utility can be used in your markup:

```
<svg class="fill-regal-blue">  <!-- ... --></svg>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
