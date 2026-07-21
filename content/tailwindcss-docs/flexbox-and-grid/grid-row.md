---
title: grid-row
description: Utilities for controlling how elements are sized and placed across grid
  rows.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 110
metadata:
  source: https://tailwindcss.com/docs/grid-row
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# grid-row

Utilities for controlling how elements are sized and placed across grid rows.

| Class | Styles |
| --- | --- |
| `row-span-<number>` | `grid-row: span <number> / span <number>;` |
| `row-span-full` | `grid-row: 1 / -1;` |
| `row-span-(<custom-property>)` | `grid-row: span var(<custom-property>) / span var(<custom-property>);` |
| `row-span-[<value>]` | `grid-row: span <value> / span <value>;` |
| `row-start-<number>` | `grid-row-start: <number>;` |
| `-row-start-<number>` | `grid-row-start: calc(<number> * -1);` |
| `row-start-auto` | `grid-row-start: auto;` |
| `row-start-(<custom-property>)` | `grid-row-start: var(<custom-property>);` |
| `row-start-[<value>]` | `grid-row-start: <value>;` |
| `row-end-<number>` | `grid-row-end: <number>;` |

## [Examples](#examples)

### [Spanning rows](#spanning-rows)

Use `row-span-<number>` utilities like `row-span-2` and `row-span-4` to make an element span *n* rows:

```
<div class="grid grid-flow-col grid-rows-3 gap-4">  <div class="row-span-3 ...">01</div>  <div class="col-span-2 ...">02</div>  <div class="col-span-2 row-span-2 ...">03</div></div>
```

### [Starting and ending lines](#starting-and-ending-lines)

Use `row-start-<number>` or `row-end-<number>` utilities like `row-start-2` and `row-end-3` to make an element start or end at the *nth* grid line:

```
<div class="grid grid-flow-col grid-rows-3 gap-4">  <div class="row-span-2 row-start-2 ...">01</div>  <div class="row-span-2 row-end-3 ...">02</div>  <div class="row-start-1 row-end-4 ...">03</div></div>
```

These can also be combined with the `row-span-<number>` utilities to span a specific number of rows.

### [Using a custom value](#using-a-custom-value)

Use utilities like `row-[<value>]`,`row-span-[<value>]`,`row-start-[<value>]`, and `row-end-[<value>]` to set the grid row size and location based on a completely custom value:

```
<div class="row-[span_16_/_span_16] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `row-(<custom-property>)` syntax:

```
<div class="row-(--my-rows) ...">  <!-- ... --></div>
```

This is just a shorthand for `row-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix `grid-row`,`grid-row-start`, and `grid-row-end` utilities with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="row-span-3 md:row-span-4 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
