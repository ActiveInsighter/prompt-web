---
title: inline-size
description: Utilities for setting the inline size of an element.
language: en-US
role: reference
tags:
- tailwindcss
- sizing
sort: 70
metadata:
  source: https://tailwindcss.com/docs/inline-size
  sidebar_group: Sizing
  section: Sizing
  collector: rendered-html
---

# inline-size

Utilities for setting the inline size of an element.

| Class | Styles |
| --- | --- |
| `inline-<number>` | `inline-size: calc(var(--spacing) * <number>);` |
| `inline-<fraction>` | `inline-size: calc(<fraction> * 100%);` |
| `inline-3xs` | `inline-size: var(--container-3xs); /* 16rem (256px) */` |
| `inline-2xs` | `inline-size: var(--container-2xs); /* 18rem (288px) */` |
| `inline-xs` | `inline-size: var(--container-xs); /* 20rem (320px) */` |
| `inline-sm` | `inline-size: var(--container-sm); /* 24rem (384px) */` |
| `inline-md` | `inline-size: var(--container-md); /* 28rem (448px) */` |
| `inline-lg` | `inline-size: var(--container-lg); /* 32rem (512px) */` |
| `inline-xl` | `inline-size: var(--container-xl); /* 36rem (576px) */` |
| `inline-2xl` | `inline-size: var(--container-2xl); /* 42rem (672px) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `inline-<number>` utilities like `inline-24` and `inline-64` to set an element to a fixed inline size based on the spacing scale:

```
<div class="inline-96 ...">inline-96</div><div class="inline-80 ...">inline-80</div><div class="inline-64 ...">inline-64</div><div class="inline-48 ...">inline-48</div><div class="inline-40 ...">inline-40</div><div class="inline-32 ...">inline-32</div>
```

### [Using a percentage](#using-a-percentage)

Use `inline-full` or `inline-<fraction>` utilities like `inline-1/2` and `inline-2/5` to give an element a percentage-based inline size:

```
<div class="flex ...">  <div class="inline-1/2 ...">inline-1/2</div>  <div class="inline-1/2 ...">inline-1/2</div></div><div class="flex ...">  <div class="inline-2/5 ...">inline-2/5</div>  <div class="inline-3/5 ...">inline-3/5</div></div><div class="flex ...">  <div class="inline-1/3 ...">inline-1/3</div>  <div class="inline-2/3 ...">inline-2/3</div></div><div class="inline-full ...">inline-full</div>
```

### [Using the container scale](#using-the-container-scale)

Use utilities like `inline-sm` and `inline-xl` to set an element to a fixed inline size based on the container scale:

```
<div class="inline-xl ...">inline-xl</div><div class="inline-lg ...">inline-lg</div><div class="inline-md ...">inline-md</div><div class="inline-sm ...">inline-sm</div><div class="inline-xs ...">inline-xs</div><div class="inline-2xs ...">inline-2xs</div><div class="inline-3xs ...">inline-3xs</div>
```

### [Matching the viewport](#matching-the-viewport)

Use the `inline-screen` utility to make an element span the entire inline size of the viewport:

```
<div class="inline-screen">  <!-- ... --></div>
```

### [Resetting the inline size](#resetting-the-inline-size)

Use the `inline-auto` utility to remove an element's assigned inline size under a specific condition, like at a particular breakpoint:

```
<div class="inline-full md:inline-auto">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `inline-[<value>]` syntax to set the inline size based on a completely custom value:

```
<div class="inline-[5px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `inline-(<custom-property>)` syntax:

```
<div class="inline-(--my-inline-size) ...">  <!-- ... --></div>
```

This is just a shorthand for `inline-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix an `inline-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="inline-1/2 md:inline-full ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `inline-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
