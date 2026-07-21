---
title: order
description: Utilities for controlling the order of flex and grid items.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 70
metadata:
  source: https://tailwindcss.com/docs/order
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# order

Utilities for controlling the order of flex and grid items.

| Class | Styles |
| --- | --- |
| `order-<number>` | `order: <number>;` |
| `-order-<number>` | `order: calc(<number> * -1);` |
| `order-first` | `order: -9999;` |
| `order-last` | `order: 9999;` |
| `order-(<custom-property>)` | `order: var(<custom-property>);` |
| `order-[<value>]` | `order: <value>;` |

## [Examples](#examples)

### [Explicitly setting a sort order](#explicitly-setting-a-sort-order)

Use `order-<number>` utilities like `order-1` and `order-3` to render flex and grid items in a different order than they appear in the document:

```
<div class="flex justify-between ...">  <div class="order-3 ...">01</div>  <div class="order-1 ...">02</div>  <div class="order-2 ...">03</div></div>
```

### [Ordering items first or last](#ordering-items-first-or-last)

Use the `order-first` and `order-last` utilities to render flex and grid items first or last:

```
<div class="flex justify-between ...">  <div class="order-last ...">01</div>  <div class="...">02</div>  <div class="order-first ...">03</div></div>
```

### [Using negative values](#using-negative-values)

To use a negative order value, prefix the class name with a dash to convert it to a negative value:

```
<div class="-order-1">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `order-[<value>]` syntax to set the order based on a completely custom value:

```
<div class="order-[min(var(--total-items),10)] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `order-(<custom-property>)` syntax:

```
<div class="order-(--my-order) ...">  <!-- ... --></div>
```

This is just a shorthand for `order-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix an `order` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="order-first md:order-last ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
