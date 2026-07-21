---
title: 'filter: drop-shadow()'
description: Utilities for applying drop-shadow filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 50
metadata:
  source: https://tailwindcss.com/docs/filter-drop-shadow
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# filter: drop-shadow()

Utilities for applying drop-shadow filters to an element.

| Class | Styles |
| --- | --- |
| `drop-shadow-xs` | `filter: drop-shadow(var(--drop-shadow-xs)); /* 0 1px 1px rgb(0 0 0 / 0.05) */` |
| `drop-shadow-sm` | `filter: drop-shadow(var(--drop-shadow-sm)); /* 0 1px 2px rgb(0 0 0 / 0.15) */` |
| `drop-shadow-md` | `filter: drop-shadow(var(--drop-shadow-md)); /* 0 3px 3px rgb(0 0 0 / 0.12) */` |
| `drop-shadow-lg` | `filter: drop-shadow(var(--drop-shadow-lg)); /* 0 4px 4px rgb(0 0 0 / 0.15) */` |
| `drop-shadow-xl` | `filter: drop-shadow(var(--drop-shadow-xl); /* 0 9px 7px rgb(0 0 0 / 0.1) */` |
| `drop-shadow-2xl` | `filter: drop-shadow(var(--drop-shadow-2xl)); /* 0 25px 25px rgb(0 0 0 / 0.15) */` |
| `drop-shadow-none` | `filter: drop-shadow(0 0 #0000);` |
| `drop-shadow-(<custom-property>)` | `filter: drop-shadow(var(<custom-property>));` |
| `drop-shadow-(color:<custom-property>)` | `--tw-drop-shadow-color: var(<custom-property>);` |
| `drop-shadow-[<value>]` | `filter: drop-shadow(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `drop-shadow-sm` and `drop-shadow-xl` to add a drop shadow to an element:

```
<svg class="drop-shadow-md ...">  <!-- ... --></svg><svg class="drop-shadow-lg ...">  <!-- ... --></svg><svg class="drop-shadow-xl ...">  <!-- ... --></svg>
```

This is useful for applying shadows to irregular shapes, like text and SVG elements. For applying shadows to regular elements, you probably want to use [box shadow](https://tailwindcss.com/docs/box-shadow) instead.

### [Changing the opacity](#changing-the-opacity)

Use the opacity modifier to adjust the opacity of the drop shadow:

```
<svg class="fill-white drop-shadow-xl ...">...</svg><svg class="fill-white drop-shadow-xl/25 ...">...</svg><svg class="fill-white drop-shadow-xl/50 ...">...</svg>
```

The default drop shadow opacities are quite low (15% or less), so increasing the opacity (to like 50%) will make the drop shadows more pronounced.

### [Setting the shadow color](#setting-the-shadow-color)

Use utilities like `drop-shadow-indigo-500` and `drop-shadow-cyan-500/50` to change the color of a drop shadow:

```
<svg class="fill-cyan-500 drop-shadow-lg drop-shadow-cyan-500/50 ...">...</svg><svg class="fill-indigo-500 drop-shadow-lg drop-shadow-indigo-500/50 ...">...</svg>
```

By default colored shadows have an opacity of 100% but you can adjust this using the opacity modifier.

### [Removing a drop shadow](#removing-a-drop-shadow)

Use the `drop-shadow-none` utility to remove an existing drop shadow from an element:

```
<svg class="drop-shadow-lg dark:drop-shadow-none">  <!-- ... --></svg>
```

### [Using a custom value](#using-a-custom-value)

Use the `drop-shadow-[<value>]` syntax to set the drop shadow based on a completely custom value:

```
<svg class="drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] ...">  <!-- ... --></svg>
```

For CSS variables, you can also use the `drop-shadow-(<custom-property>)` syntax:

```
<svg class="drop-shadow-(--my-drop-shadow) ...">  <!-- ... --></svg>
```

This is just a shorthand for `drop-shadow-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `filter: drop-shadow()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<svg class="drop-shadow-md md:drop-shadow-xl ...">  <!-- ... --></svg>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

### [Customizing drop shadows](#customizing-drop-shadows)

Use the `--drop-shadow-*` theme variables to customize the drop shadow utilities in your project:

```
@theme {  --drop-shadow-3xl: 0 35px 35px rgba(0, 0, 0, 0.25); }
```

Now the `drop-shadow-3xl` utility can be used in your markup:

```
<svg class="drop-shadow-3xl">  <!-- ... --></svg>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).

### [Customizing shadow colors](#customizing-shadow-colors)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `drop-shadow-regal-blue` utility can be used in your markup:

```
<svg class="drop-shadow-regal-blue">  <!-- ... --></svg>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
