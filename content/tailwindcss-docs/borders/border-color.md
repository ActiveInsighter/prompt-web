---
title: border-color
description: Utilities for controlling the color of an element's borders.
language: en-US
role: reference
tags:
- tailwindcss
- borders
sort: 30
metadata:
  source: https://tailwindcss.com/docs/border-color
  sidebar_group: Borders
  section: Borders
  collector: rendered-html
---

# border-color

Utilities for controlling the color of an element's borders.

| Class | Styles |
| --- | --- |
| `border-inherit` | `border-color: inherit;` |
| `border-current` | `border-color: currentColor;` |
| `border-transparent` | `border-color: transparent;` |
| `border-black` | `border-color: var(--color-black); /* #000 */` |
| `border-white` | `border-color: var(--color-white); /* #fff */` |
| `border-red-50` | `border-color: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */` |
| `border-red-100` | `border-color: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */` |
| `border-red-200` | `border-color: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */` |
| `border-red-300` | `border-color: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */` |
| `border-red-400` | `border-color: var(--color-red-400); /* oklch(70.4% 0.191 22.216) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `border-rose-500` and `border-lime-100` to control the border color of an element:

```
<div class="border-4 border-indigo-500 ..."></div><div class="border-4 border-purple-500 ..."></div><div class="border-4 border-sky-500 ..."></div>
```

### [Changing the opacity](#changing-the-opacity)

Use the color opacity modifier to control the opacity of an element's border color:

```
<div class="border-4 border-indigo-500/100 ..."></div><div class="border-4 border-indigo-500/75 ..."></div><div class="border-4 border-indigo-500/50 ..."></div>
```

### [Individual sides](#individual-sides)

Use utilities like `border-t-indigo-500` and `border-r-lime-100` to set the border color for one side of an element:

```
<div class="border-4 border-indigo-200 border-t-indigo-500 ..."></div><div class="border-4 border-indigo-200 border-r-indigo-500 ..."></div><div class="border-4 border-indigo-200 border-b-indigo-500 ..."></div><div class="border-4 border-indigo-200 border-l-indigo-500 ..."></div>
```

### [Horizontal and vertical sides](#horizontal-and-vertical-sides)

Use utilities like `border-x-indigo-500` and `border-y-lime-100` to set the border color on two sides of an element at the same time:

```
<div class="border-4 border-indigo-200 border-x-indigo-500 ..."></div><div class="border-4 border-indigo-200 border-y-indigo-500 ..."></div>
```

### [Using logical properties](#using-logical-properties)

Use utilities like `border-s-indigo-500` and `border-e-lime-100` to set the `border-inline-start-color` and `border-inline-end-color` [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties/Basic_concepts), which map to either the left or right border based on the text direction:

```
<div dir="ltr">  <div class="border-s-indigo-500 ..."></div></div><div dir="rtl">  <div class="border-s-indigo-500 ..."></div></div>
```

Use the `border-bs-*` and `border-be-*` utilities to set the `border-block-start-color` and `border-block-end-color` logical properties, which map to either the top or bottom border based on the writing mode:

```
<div class="border-bs-indigo-500 ..."></div>
```

### [Divider between children](#divider-between-children)

Use utilities like `divide-indigo-500` and `divide-lime-100` to control the border color between child elements:

```
<div class="grid grid-cols-3 divide-x-4 divide-indigo-500">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `border-[<value>]` syntax to set the border color based on a completely custom value:

```
<div class="border-[#243c5a] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `border-(<custom-property>)` syntax:

```
<div class="border-(--my-border) ...">  <!-- ... --></div>
```

This is just a shorthand for `border-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Applying on focus](#applying-on-focus)

Prefix a `border-color` utility with a variant like `focus:*` to only apply the utility in that state:

```
<input class="border-2 border-gray-700 focus:border-pink-600 ..." />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Responsive design](#responsive-design)

Prefix a `border-color` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="border-blue-500 md:border-green-500 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `border-regal-blue` utility can be used in your markup:

```
<div class="border-regal-blue">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
