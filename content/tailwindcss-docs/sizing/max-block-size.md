---
title: max-block-size
description: Utilities for setting the maximum block size of an element.
language: en-US
role: reference
tags:
- tailwindcss
- sizing
sort: 120
metadata:
  source: https://tailwindcss.com/docs/max-block-size
  sidebar_group: Sizing
  section: Sizing
  collector: rendered-html
---

# max-block-size

Utilities for setting the maximum block size of an element.

| Class | Styles |
| --- | --- |
| `max-block-<number>` | `max-block-size: calc(var(--spacing) * <number>);` |
| `max-block-<fraction>` | `max-block-size: calc(<fraction> * 100%);` |
| `max-block-none` | `max-block-size: none;` |
| `max-block-px` | `max-block-size: 1px;` |
| `max-block-full` | `max-block-size: 100%;` |
| `max-block-screen` | `max-block-size: 100vh;` |
| `max-block-dvh` | `max-block-size: 100dvh;` |
| `max-block-dvw` | `max-block-size: 100dvw;` |
| `max-block-lvh` | `max-block-size: 100lvh;` |
| `max-block-lvw` | `max-block-size: 100lvw;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `max-block-<number>` utilities like `max-block-24` and `max-block-64` to set an element to a fixed maximum block size based on the spacing scale:

```
<div class="block-96 ...">  <div class="block-full max-block-80 ...">max-block-80</div>  <div class="block-full max-block-64 ...">max-block-64</div>  <div class="block-full max-block-48 ...">max-block-48</div>  <div class="block-full max-block-40 ...">max-block-40</div>  <div class="block-full max-block-32 ...">max-block-32</div></div>
```

### [Using a percentage](#using-a-percentage)

Use `max-block-full` or `max-block-<fraction>` utilities like `max-block-1/2` and `max-block-2/5` to give an element a percentage-based maximum block size:

```
<div class="block-96 ...">  <div class="block-full max-block-9/10 ...">max-block-9/10</div>  <div class="block-full max-block-3/4 ...">max-block-3/4</div>  <div class="block-full max-block-1/2 ...">max-block-1/2</div>  <div class="block-full max-block-full ...">max-block-full</div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `max-block-[<value>]` syntax to set the maximum block size based on a completely custom value:

```
<div class="max-block-[220px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `max-block-(<custom-property>)` syntax:

```
<div class="max-block-(--my-max-block-size) ...">  <!-- ... --></div>
```

This is just a shorthand for `max-block-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `max-block-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="block-48 max-block-full md:max-block-screen ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `max-block-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
