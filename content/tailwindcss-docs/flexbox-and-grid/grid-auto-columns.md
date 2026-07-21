---
title: grid-auto-columns
description: Utilities for controlling the size of implicitly-created grid columns.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 130
metadata:
  source: https://tailwindcss.com/docs/grid-auto-columns
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# grid-auto-columns

Utilities for controlling the size of implicitly-created grid columns.

| Class | Styles |
| --- | --- |
| `auto-cols-auto` | `grid-auto-columns: auto;` |
| `auto-cols-min` | `grid-auto-columns: min-content;` |
| `auto-cols-max` | `grid-auto-columns: max-content;` |
| `auto-cols-fr` | `grid-auto-columns: minmax(0, 1fr);` |
| `auto-cols-<number>` | `grid-auto-columns: calc(var(--spacing) * <number>);` |
| `auto-cols-(<custom-property>)` | `grid-auto-columns: var(<custom-property>);` |
| `auto-cols-[<value>]` | `grid-auto-columns: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `auto-cols-min` and `auto-cols-max` to control the size of implicitly-created grid columns:

```
<div class="grid auto-cols-max grid-flow-col">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `auto-cols-[<value>]` syntax to set the size of implicitly-created grid columns based on a completely custom value:

```
<div class="auto-cols-[minmax(0,2fr)] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `auto-cols-(<custom-property>)` syntax:

```
<div class="auto-cols-(--my-auto-cols) ...">  <!-- ... --></div>
```

This is just a shorthand for `auto-cols-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `grid-auto-columns` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="grid grid-flow-col auto-cols-max md:auto-cols-min ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
