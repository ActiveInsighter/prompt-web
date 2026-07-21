---
title: background-color
description: Utilities for controlling an element's background color.
language: en-US
role: reference
tags:
- tailwindcss
- backgrounds
sort: 30
metadata:
  source: https://tailwindcss.com/docs/background-color
  sidebar_group: Backgrounds
  section: Backgrounds
  collector: rendered-html
---

# background-color

Utilities for controlling an element's background color.

| Class | Styles |
| --- | --- |
| `bg-inherit` | `background-color: inherit;` |
| `bg-current` | `background-color: currentColor;` |
| `bg-transparent` | `background-color: transparent;` |
| `bg-black` | `background-color: var(--color-black); /* #000 */` |
| `bg-white` | `background-color: var(--color-white); /* #fff */` |
| `bg-red-50` | `background-color: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */` |
| `bg-red-100` | `background-color: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */` |
| `bg-red-200` | `background-color: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */` |
| `bg-red-300` | `background-color: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */` |
| `bg-red-400` | `background-color: var(--color-red-400); /* oklch(70.4% 0.191 22.216) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `bg-white`, `bg-indigo-500` and `bg-transparent` to control the background color of an element:

```
<button class="bg-blue-500 ...">Button A</button><button class="bg-cyan-500 ...">Button B</button><button class="bg-pink-500 ...">Button C</button>
```

### [Changing the opacity](#changing-the-opacity)

Use the color opacity modifier to control the opacity of an element's background color:

```
<button class="bg-sky-500/100 ..."></button><button class="bg-sky-500/75 ..."></button><button class="bg-sky-500/50 ..."></button>
```

### [Using a custom value](#using-a-custom-value)

Use the `bg-[<value>]` syntax to set the background color based on a completely custom value:

```
<div class="bg-[#50d71e] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `bg-(<custom-property>)` syntax:

```
<div class="bg-(--my-color) ...">  <!-- ... --></div>
```

This is just a shorthand for `bg-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Applying on hover](#applying-on-hover)

Prefix a `background-color` utility with a variant like `hover:*` to only apply the utility in that state:

```
<button class="bg-indigo-500 hover:bg-fuchsia-500 ...">Save changes</button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Responsive design](#responsive-design)

Prefix a `background-color` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="bg-blue-500 md:bg-green-500 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `bg-regal-blue` utility can be used in your markup:

```
<div class="bg-regal-blue">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
