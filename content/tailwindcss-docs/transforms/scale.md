---
title: scale
description: Utilities for scaling elements.
language: en-US
role: reference
tags:
- tailwindcss
- transforms
sort: 50
metadata:
  source: https://tailwindcss.com/docs/scale
  sidebar_group: Transforms
  section: Transforms
  collector: rendered-html
---

# scale

Utilities for scaling elements.

| Class | Styles |
| --- | --- |
| `scale-none` | `scale: none;` |
| `scale-<number>` | `scale: <number>% <number>%;` |
| `-scale-<number>` | `scale: calc(<number>% * -1) calc(<number>% * -1);` |
| `scale-(<custom-property>)` | `scale: var(<custom-property>) var(<custom-property>);` |
| `scale-[<value>]` | `scale: <value>;` |
| `scale-x-<number>` | `scale: <number>% var(--tw-scale-y);` |
| `-scale-x-<number>` | `scale: calc(<number>% * -1) var(--tw-scale-y);` |
| `scale-x-(<custom-property>)` | `scale: var(<custom-property>) var(--tw-scale-y);` |
| `scale-x-[<value>]` | `scale: <value> var(--tw-scale-y);` |
| `scale-y-<number>` | `scale: var(--tw-scale-x) <number>%;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `scale-<number>` utilities like `scale-75` and `scale-150` to scale an element by a percentage of its original size:

```
<img class="scale-75 ..." src="/img/mountains.jpg" /><img class="scale-100 ..." src="/img/mountains.jpg" /><img class="scale-125 ..." src="/img/mountains.jpg" />
```

### [Scaling on the x-axis](#scaling-on-the-x-axis)

Use the `scale-x-<number>` utilities like `scale-x-75` and `-scale-x-150` to scale an element on the x-axis by a percentage of its original width:

```
<img class="scale-x-75 ..." src="/img/mountains.jpg" /><img class="scale-x-100 ..." src="/img/mountains.jpg" /><img class="scale-x-125 ..." src="/img/mountains.jpg" />
```

### [Scaling on the y-axis](#scaling-on-the-y-axis)

Use the `scale-y-<number>` utilities like `scale-y-75` and `scale-y-150` to scale an element on the y-axis by a percentage of its original height:

```
<img class="scale-y-75 ..." src="/img/mountains.jpg" /><img class="scale-y-100 ..." src="/img/mountains.jpg" /><img class="scale-y-125 ..." src="/img/mountains.jpg" />
```

### [Using negative values](#using-negative-values)

Use `-scale-<number>`, `-scale-x-<number>` or `-scale-y-<number>` utilities like `-scale-x-75` and `-scale-125` to mirror and scale down an element by a percentage of its original size:

```
<img class="-scale-x-75 ..." src="/img/mountains.jpg" /><img class="-scale-100 ..." src="/img/mountains.jpg" /><img class="-scale-y-125 ..." src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `scale-[<value>]` syntax to set the scale based on a completely custom value:

```
<img class="scale-[1.7] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `scale-(<custom-property>)` syntax:

```
<img class="scale-(--my-scale) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `scale-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Applying on hover](#applying-on-hover)

Prefix a `scale` utility with a variant like `hover:*` to only apply the utility in that state:

```
<img class="scale-95 hover:scale-120 ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
