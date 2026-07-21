---
title: max-inline-size
description: Utilities for setting the maximum inline size of an element.
language: en-US
role: reference
tags:
- tailwindcss
- sizing
sort: 90
metadata:
  source: https://tailwindcss.com/docs/max-inline-size
  sidebar_group: Sizing
  section: Sizing
  collector: rendered-html
---

# max-inline-size

Utilities for setting the maximum inline size of an element.

| Class | Styles |
| --- | --- |
| `max-inline-<number>` | `max-inline-size: calc(var(--spacing) * <number>);` |
| `max-inline-<fraction>` | `max-inline-size: calc(<fraction> * 100%);` |
| `max-inline-3xs` | `max-inline-size: var(--container-3xs); /* 16rem (256px) */` |
| `max-inline-2xs` | `max-inline-size: var(--container-2xs); /* 18rem (288px) */` |
| `max-inline-xs` | `max-inline-size: var(--container-xs); /* 20rem (320px) */` |
| `max-inline-sm` | `max-inline-size: var(--container-sm); /* 24rem (384px) */` |
| `max-inline-md` | `max-inline-size: var(--container-md); /* 28rem (448px) */` |
| `max-inline-lg` | `max-inline-size: var(--container-lg); /* 32rem (512px) */` |
| `max-inline-xl` | `max-inline-size: var(--container-xl); /* 36rem (576px) */` |
| `max-inline-2xl` | `max-inline-size: var(--container-2xl); /* 42rem (672px) */` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `max-inline-<number>` utilities like `max-inline-24` and `max-inline-64` to set an element to a fixed maximum inline size based on the spacing scale:

Resize the example to see the expected behavior

```
<div class="inline-full max-inline-96 ...">max-inline-96</div><div class="inline-full max-inline-80 ...">max-inline-80</div><div class="inline-full max-inline-64 ...">max-inline-64</div><div class="inline-full max-inline-48 ...">max-inline-48</div><div class="inline-full max-inline-40 ...">max-inline-40</div><div class="inline-full max-inline-32 ...">max-inline-32</div>
```

### [Using a percentage](#using-a-percentage)

Use `max-inline-full` or `max-inline-<fraction>` utilities like `max-inline-1/2` and `max-inline-2/5` to give an element a percentage-based maximum inline size:

Resize the example to see the expected behavior

```
<div class="inline-full max-inline-9/10 ...">max-inline-9/10</div><div class="inline-full max-inline-3/4 ...">max-inline-3/4</div><div class="inline-full max-inline-1/2 ...">max-inline-1/2</div><div class="inline-full max-inline-1/3 ...">max-inline-1/3</div>
```

### [Using the container scale](#using-the-container-scale)

Use utilities like `max-inline-sm` and `max-inline-xl` to set an element to a fixed maximum inline size based on the container scale:

Resize the example to see the expected behavior

```
<div class="max-inline-md ...">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `max-inline-[<value>]` syntax to set the maximum inline size based on a completely custom value:

```
<div class="max-inline-[220px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `max-inline-(<custom-property>)` syntax:

```
<div class="max-inline-(--my-max-inline-size) ...">  <!-- ... --></div>
```

This is just a shorthand for `max-inline-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `max-inline-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="max-inline-sm md:max-inline-lg ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `max-inline-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
