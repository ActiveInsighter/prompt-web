---
title: 'backdrop-filter: blur()'
description: Utilities for applying backdrop blur filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 120
metadata:
  source: https://tailwindcss.com/docs/backdrop-filter-blur
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# backdrop-filter: blur()

Utilities for applying backdrop blur filters to an element.

| Class | Styles |
| --- | --- |
| `backdrop-blur-xs` | `backdrop-filter: blur(var(--blur-xs)); /* 4px */` |
| `backdrop-blur-sm` | `backdrop-filter: blur(var(--blur-sm)); /* 8px */` |
| `backdrop-blur-md` | `backdrop-filter: blur(var(--blur-md)); /* 12px */` |
| `backdrop-blur-lg` | `backdrop-filter: blur(var(--blur-lg)); /* 16px */` |
| `backdrop-blur-xl` | `backdrop-filter: blur(var(--blur-xl)); /* 24px */` |
| `backdrop-blur-2xl` | `backdrop-filter: blur(var(--blur-2xl)); /* 40px */` |
| `backdrop-blur-3xl` | `backdrop-filter: blur(var(--blur-3xl)); /* 64px */` |
| `backdrop-blur-none` | `backdrop-filter: ;` |
| `backdrop-blur-(<custom-property>)` | `backdrop-filter: blur(var(<custom-property>));` |
| `backdrop-blur-[<value>]` | `backdrop-filter: blur(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `backdrop-blur-sm` and `backdrop-blur-lg` to control an element’s backdrop blur:

```
<div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-blur-none ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-blur-sm ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-blur-md ..."></div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `backdrop-blur-[<value>]` syntax to set the backdrop blur based on a completely custom value:

```
<div class="backdrop-blur-[2px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `backdrop-blur-(<custom-property>)` syntax:

```
<div class="backdrop-blur-(--my-backdrop-blur) ...">  <!-- ... --></div>
```

This is just a shorthand for `backdrop-blur-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `backdrop-filter: blur()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="backdrop-blur-none md:backdrop-blur-lg ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--blur-*` theme variables to customize the backdrop blur utilities in your project:

```
@theme {  --blur-2xs: 2px; }
```

Now the `backdrop-blur-2xs` utility can be used in your markup:

```
<div class="backdrop-blur-2xs">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
