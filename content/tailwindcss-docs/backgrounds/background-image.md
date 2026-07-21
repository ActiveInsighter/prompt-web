---
title: background-image
description: Utilities for controlling an element's background image.
language: en-US
role: reference
tags:
- tailwindcss
- backgrounds
sort: 40
metadata:
  source: https://tailwindcss.com/docs/background-image
  sidebar_group: Backgrounds
  section: Backgrounds
  collector: rendered-html
---

# background-image

Utilities for controlling an element's background image.

| Class | Styles |
| --- | --- |
| `bg-[<value>]` | `background-image: <value>;` |
| `bg-(image:<custom-property>)` | `background-image: var(<custom-property>);` |
| `bg-none` | `background-image: none;` |
| `bg-linear-to-t` | `background-image: linear-gradient(to top, var(--tw-gradient-stops));` |
| `bg-linear-to-tr` | `background-image: linear-gradient(to top right, var(--tw-gradient-stops));` |
| `bg-linear-to-r` | `background-image: linear-gradient(to right, var(--tw-gradient-stops));` |
| `bg-linear-to-br` | `background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));` |
| `bg-linear-to-b` | `background-image: linear-gradient(to bottom, var(--tw-gradient-stops));` |
| `bg-linear-to-bl` | `background-image: linear-gradient(to bottom left, var(--tw-gradient-stops));` |
| `bg-linear-to-l` | `background-image: linear-gradient(to left, var(--tw-gradient-stops));` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `bg-[<value>]` syntax to set the background image of an element:

```
<div class="bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Adding a linear gradient](#adding-a-linear-gradient)

Use utilities like `bg-linear-to-r` and `bg-linear-<angle>` with the [color stop utilities](#setting-gradient-color-stops) to add a linear gradient to an element:

```
<div class="h-14 bg-linear-to-r from-cyan-500 to-blue-500"></div><div class="h-14 bg-linear-to-t from-sky-500 to-indigo-500"></div><div class="h-14 bg-linear-to-bl from-violet-500 to-fuchsia-500"></div><div class="h-14 bg-linear-65 from-purple-500 to-pink-500"></div>
```

### [Adding a radial gradient](#adding-a-radial-gradient)

Use the `bg-radial` and `bg-radial-[<position>]` utilities with the [color stop utilities](#setting-gradient-color-stops) to add a radial gradient to an element:

```
<div class="size-18 rounded-full bg-radial from-pink-400 from-40% to-fuchsia-700"></div><div class="size-18 rounded-full bg-radial-[at_50%_75%] from-sky-200 via-blue-400 to-indigo-900 to-90%"></div><div class="size-18 rounded-full bg-radial-[at_25%_25%] from-white to-zinc-900 to-75%"></div>
```

### [Adding a conic gradient](#adding-a-conic-gradient)

Use the `bg-conic` and `bg-conic-<angle>` utilities with the [color stop utilities](#setting-gradient-color-stops) to add a conic gradient to an element:

```
<div class="size-24 rounded-full bg-conic from-blue-600 to-sky-400 to-50%"></div><div class="size-24 rounded-full bg-conic-180 from-indigo-600 via-indigo-50 to-indigo-600"></div><div class="size-24 rounded-full bg-conic/decreasing from-violet-700 via-lime-300 to-violet-700"></div>
```

### [Setting gradient color stops](#setting-gradient-color-stops)

Use utilities like `from-indigo-500`, `via-purple-500`, and `to-pink-500` to set the colors of the gradient stops:

```
<div class="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 ..."></div>
```

### [Setting gradient stop positions](#setting-gradient-stop-positions)

Use utilities like `from-10%`, `via-30%`, and `to-90%` to set more precise positions for the gradient color stops:

```
<div class="bg-linear-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90% ..."></div>
```

### [Changing interpolation mode](#changing-interpolation-mode)

Use the interpolation modifier to control the interpolation mode of a gradient:

```
<div class="bg-linear-to-r/srgb from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/hsl from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/oklab from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/longer from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/shorter from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/increasing from-indigo-500 to-teal-400"></div><div class="bg-linear-to-r/decreasing from-indigo-500 to-teal-400"></div>
```

By default gradients are interpolated in the `oklab` color space.

### [Removing background images](#removing-background-images)

Use the `bg-none` utility to remove an existing background image from an element:

```
<div class="bg-none"></div>
```

### [Using a custom value](#using-a-custom-value)

Use utilities like `bg-linear-[<value>]` and `from-[<value>]` to set the gradient based on a completely custom value:

```
<div class="bg-linear-[25deg,red_5%,yellow_60%,lime_90%,teal] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `bg-linear-(<custom-property>)` syntax:

```
<div class="bg-linear-(--my-gradient) ...">  <!-- ... --></div>
```

This is just a shorthand for `bg-linear-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `background-image` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="from-purple-400 md:from-yellow-500 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now utilities like `from-regal-blue`,`via-regal-blue`, and `to-regal-blue` can be used in your markup:

```
<div class="from-regal-blue">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
