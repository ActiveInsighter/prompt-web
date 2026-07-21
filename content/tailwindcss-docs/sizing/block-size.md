---
title: block-size
description: Utilities for setting the block size of an element.
language: en-US
role: reference
tags:
- tailwindcss
- sizing
sort: 100
metadata:
  source: https://tailwindcss.com/docs/block-size
  sidebar_group: Sizing
  section: Sizing
  collector: rendered-html
---

# block-size

Utilities for setting the block size of an element.

| Class | Styles |
| --- | --- |
| `block-<number>` | `block-size: calc(var(--spacing) * <number>);` |
| `block-<fraction>` | `block-size: calc(<fraction> * 100%);` |
| `block-auto` | `block-size: auto;` |
| `block-px` | `block-size: 1px;` |
| `block-full` | `block-size: 100%;` |
| `block-screen` | `block-size: 100vh;` |
| `block-dvh` | `block-size: 100dvh;` |
| `block-dvw` | `block-size: 100dvw;` |
| `block-lvh` | `block-size: 100lvh;` |
| `block-lvw` | `block-size: 100lvw;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `block-<number>` utilities like `block-24` and `block-64` to set an element to a fixed block size based on the spacing scale:

```
<div class="block-96 ...">block-96</div><div class="block-80 ...">block-80</div><div class="block-64 ...">block-64</div><div class="block-48 ...">block-48</div><div class="block-40 ...">block-40</div><div class="block-32 ...">block-32</div><div class="block-24 ...">block-24</div>
```

### [Using a percentage](#using-a-percentage)

Use `block-full` or `block-<fraction>` utilities like `block-1/2` and `block-2/5` to give an element a percentage-based block size:

```
<div class="block-full ...">block-full</div><div class="block-9/10 ...">block-9/10</div><div class="block-3/4 ...">block-3/4</div><div class="block-1/2 ...">block-1/2</div><div class="block-1/3 ...">block-1/3</div>
```

### [Matching viewport](#matching-viewport)

Use the `block-screen` utility to make an element span the entire block size of the viewport:

```
<div class="block-screen">  <!-- ... --></div>
```

### [Matching dynamic viewport](#matching-dynamic-viewport)

Use the `block-dvh` utility to make an element span the entire block size of the viewport, which changes as the browser UI expands or contracts:

```
<div class="block-dvh">  <!-- ... --></div>
```

### [Matching large viewport](#matching-large-viewport)

Use the `block-lvh` utility to set an element's block size to the largest possible size of the viewport:

```
<div class="block-lvh">  <!-- ... --></div>
```

### [Matching small viewport](#matching-small-viewport)

Use the `block-svh` utility to set an element's block size to the smallest possible size of the viewport:

```
<div class="block-svh">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `block-[<value>]` syntax to set the block size based on a completely custom value:

```
<div class="block-[32rem] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `block-(<custom-property>)` syntax:

```
<div class="block-(--my-block-size) ...">  <!-- ... --></div>
```

This is just a shorthand for `block-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `block-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="block-1/2 md:block-full ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `block-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
