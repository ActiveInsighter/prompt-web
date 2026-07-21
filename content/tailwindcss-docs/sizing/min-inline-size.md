---
title: min-inline-size
description: Utilities for setting the minimum inline size of an element.
language: en-US
role: reference
tags:
- tailwindcss
- sizing
sort: 80
metadata:
  source: https://tailwindcss.com/docs/min-inline-size
  sidebar_group: Sizing
  section: Sizing
  collector: rendered-html
---

# min-inline-size

Utilities for setting the minimum inline size of an element.

| Class | Styles |
| --- | --- |
| `min-inline-<number>` | `min-inline-size: calc(var(--spacing) * <number>);` |
| `min-inline-<fraction>` | `min-inline-size: calc(<fraction> * 100%);` |
| `min-inline-3xs` | `min-inline-size: var(--container-3xs); /* 16rem (256px) */` |
| `min-inline-2xs` | `min-inline-size: var(--container-2xs); /* 18rem (288px) */` |
| `min-inline-xs` | `min-inline-size: var(--container-xs); /* 20rem (320px) */` |
| `min-inline-sm` | `min-inline-size: var(--container-sm); /* 24rem (384px) */` |
| `min-inline-md` | `min-inline-size: var(--container-md); /* 28rem (448px) */` |
| `min-inline-lg` | `min-inline-size: var(--container-lg); /* 32rem (512px) */` |
| `min-inline-xl` | `min-inline-size: var(--container-xl); /* 36rem (576px) */` |
| `min-inline-2xl` | `min-inline-size: var(--container-2xl); /* 42rem (672px) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `min-inline-<number>` utilities like `min-inline-24` and `min-inline-64` to set an element to a fixed minimum inline size based on the spacing scale:

```
<div class="inline-20 ...">  <div class="min-inline-80 ...">min-inline-80</div>  <div class="min-inline-64 ...">min-inline-64</div>  <div class="min-inline-48 ...">min-inline-48</div>  <div class="min-inline-40 ...">min-inline-40</div>  <div class="min-inline-32 ...">min-inline-32</div>  <div class="min-inline-24 ...">min-inline-24</div></div>
```

### [Using a percentage](#using-a-percentage)

Use `min-inline-full` or `min-inline-<fraction>` utilities like `min-inline-1/2` and `min-inline-2/5` to give an element a percentage-based minimum inline size:

```
<div class="flex ...">  <div class="min-inline-3/4 ...">min-inline-3/4</div>  <div class="inline-full ...">inline-full</div></div>
```

### [Using the container scale](#using-the-container-scale)

Use utilities like `min-inline-sm` and `min-inline-xl` to set an element to a fixed minimum inline size based on the container scale:

```
<div class="inline-40 ...">  <div class="min-inline-lg ...">min-inline-lg</div>  <div class="min-inline-md ...">min-inline-md</div>  <div class="min-inline-sm ...">min-inline-sm</div>  <div class="min-inline-xs ...">min-inline-xs</div>  <div class="min-inline-2xs ...">min-inline-2xs</div>  <div class="min-inline-3xs ...">min-inline-3xs</div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `min-inline-[<value>]` syntax to set the minimum inline size based on a completely custom value:

```
<div class="min-inline-[220px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `min-inline-(<custom-property>)` syntax:

```
<div class="min-inline-(--my-min-inline-size) ...">  <!-- ... --></div>
```

This is just a shorthand for `min-inline-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `min-inline-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="inline-24 min-inline-full md:min-inline-0 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `min-inline-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
