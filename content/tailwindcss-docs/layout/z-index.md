---
title: z-index
description: Utilities for controlling the stack order of an element.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 190
metadata:
  source: https://tailwindcss.com/docs/z-index
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# z-index

Utilities for controlling the stack order of an element.

| Class | Styles |
| --- | --- |
| `z-<number>` | `z-index: <number>;` |
| `z-auto` | `z-index: auto;` |
| `z-[<value>]` | `z-index: <value>;` |
| `z-(<custom-property>)` | `z-index: var(<custom-property>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `z-<number>` utilities like `z-10` and `z-50` to control the stack order (or three-dimensional positioning) of an element, regardless of the order it has been displayed:

```
<div class="z-40 ...">05</div><div class="z-30 ...">04</div><div class="z-20 ...">03</div><div class="z-10 ...">02</div><div class="z-0 ...">01</div>
```

### [Using negative values](#using-negative-values)

To use a negative z-index value, prefix the class name with a dash to convert it to a negative value:

```
<div class="...">05</div><div class="...">04</div><div class="-z-10 ...">03</div><div class="...">02</div><div class="...">01</div>
```

### [Using a custom value](#using-a-custom-value)

Use the `z-[<value>]` syntax to set the stack order based on a completely custom value:

```
<div class="z-[calc(var(--index)+1)] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `z-(<custom-property>)` syntax:

```
<div class="z-(--my-z) ...">  <!-- ... --></div>
```

This is just a shorthand for `z-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `z-index` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="z-0 md:z-50 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
