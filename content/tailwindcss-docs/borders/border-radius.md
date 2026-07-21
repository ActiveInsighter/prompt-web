---
title: border-radius
description: Utilities for controlling the border radius of an element.
language: en-US
role: reference
tags:
- tailwindcss
- borders
sort: 10
metadata:
  source: https://tailwindcss.com/docs/border-radius
  sidebar_group: Borders
  section: Borders
  collector: rendered-html
---

# border-radius

Utilities for controlling the border radius of an element.

| Class | Styles |
| --- | --- |
| `rounded-xs` | `border-radius: var(--radius-xs); /* 0.125rem (2px) */` |
| `rounded-sm` | `border-radius: var(--radius-sm); /* 0.25rem (4px) */` |
| `rounded-md` | `border-radius: var(--radius-md); /* 0.375rem (6px) */` |
| `rounded-lg` | `border-radius: var(--radius-lg); /* 0.5rem (8px) */` |
| `rounded-xl` | `border-radius: var(--radius-xl); /* 0.75rem (12px) */` |
| `rounded-2xl` | `border-radius: var(--radius-2xl); /* 1rem (16px) */` |
| `rounded-3xl` | `border-radius: var(--radius-3xl); /* 1.5rem (24px) */` |
| `rounded-4xl` | `border-radius: var(--radius-4xl); /* 2rem (32px) */` |
| `rounded-none` | `border-radius: 0;` |
| `rounded-full` | `border-radius: calc(infinity * 1px);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `rounded-sm` and `rounded-md` to apply different border radius sizes to an element:

```
<div class="rounded-sm ..."></div><div class="rounded-md ..."></div><div class="rounded-lg ..."></div><div class="rounded-xl ..."></div>
```

### [Rounding sides separately](#rounding-sides-separately)

Use utilities like `rounded-t-md` and `rounded-r-lg` to only round one side of an element:

```
<div class="rounded-t-lg ..."></div><div class="rounded-r-lg ..."></div><div class="rounded-b-lg ..."></div><div class="rounded-l-lg ..."></div>
```

### [Rounding corners separately](#rounding-corners-separately)

Use utilities like `rounded-tr-md` and `rounded-tl-lg` utilities to only round one corner of an element:

```
<div class="rounded-tl-lg ..."></div><div class="rounded-tr-lg ..."></div><div class="rounded-br-lg ..."></div><div class="rounded-bl-lg ..."></div>
```

### [Using logical properties](#using-logical-properties)

Use utilities like `rounded-s-md` and `rounded-se-xl` to set the border radius using [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties/Basic_concepts), which map to the appropriate corners based on the text direction:

```
<div dir="ltr">  <div class="rounded-s-lg ..."></div></div><div dir="rtl">  <div class="rounded-s-lg ..."></div></div>
```

Here are all the available border radius logical property utilities and their physical property equivalents in both LTR and RTL modes.

| Class | Left-to-right | Right-to-left |
| --- | --- | --- |
| `rounded-s-*` | `rounded-l-*` | `rounded-r-*` |
| `rounded-e-*` | `rounded-r-*` | `rounded-l-*` |
| `rounded-ss-*` | `rounded-tl-*` | `rounded-tr-*` |
| `rounded-se-*` | `rounded-tr-*` | `rounded-tl-*` |
| `rounded-es-*` | `rounded-bl-*` | `rounded-br-*` |
| `rounded-ee-*` | `rounded-br-*` | `rounded-bl-*` |

For more control, you can also use the [LTR and RTL modifiers](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support) to conditionally apply specific styles depending on the current text direction.

### [Creating pill buttons](#creating-pill-buttons)

Use the `rounded-full` utility to create pill buttons:

```
<button class="rounded-full ...">Save Changes</button>
```

### [Removing the border radius](#removing-the-border-radius)

Use the `rounded-none` utility to remove an existing border radius from an element:

```
<button class="rounded-none ...">Save Changes</button>
```

### [Using a custom value](#using-a-custom-value)

Use the `rounded-[<value>]` syntax to set the border radius based on a completely custom value:

```
<div class="rounded-[2vw] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `rounded-(<custom-property>)` syntax:

```
<div class="rounded-(--my-radius) ...">  <!-- ... --></div>
```

This is just a shorthand for `rounded-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `border-radius` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="rounded md:rounded-lg ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--radius-*` theme variables to customize the border radius utilities in your project:

```
@theme {  --radius-5xl: 3rem; }
```

Now the `rounded-5xl` utility can be used in your markup:

```
<div class="rounded-5xl">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
