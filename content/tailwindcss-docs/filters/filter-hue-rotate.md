---
title: 'filter: hue-rotate()'
description: Utilities for applying hue-rotate filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 70
metadata:
  source: https://tailwindcss.com/docs/filter-hue-rotate
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# filter: hue-rotate()

Utilities for applying hue-rotate filters to an element.

| Class | Styles |
| --- | --- |
| `hue-rotate-<number>` | `filter: hue-rotate(<number>deg);` |
| `-hue-rotate-<number>` | `filter: hue-rotate(calc(<number>deg * -1));` |
| `hue-rotate-(<custom-property>)` | `filter: hue-rotate(var(<custom-property>));` |
| `hue-rotate-[<value>]` | `filter: hue-rotate(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `hue-rotate-90` and `hue-rotate-180` to rotate the hue of an element by degrees:

```
<img class="hue-rotate-15" src="/img/mountains.jpg" /><img class="hue-rotate-90" src="/img/mountains.jpg" /><img class="hue-rotate-180" src="/img/mountains.jpg" /><img class="hue-rotate-270" src="/img/mountains.jpg" />
```

### [Using negative values](#using-negative-values)

Use utilities like `-hue-rotate-15` and `-hue-rotate-45` to set a negative hue rotate value:

```
<img class="-hue-rotate-15" src="/img/mountains.jpg" /><img class="-hue-rotate-45" src="/img/mountains.jpg" /><img class="-hue-rotate-90" src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `hue-rotate-[<value>]` syntax to set the hue rotation based on a completely custom value:

```
<img class="hue-rotate-[3.142rad] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `hue-rotate-(<custom-property>)` syntax:

```
<img class="hue-rotate-(--my-hue-rotate) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `hue-rotate-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `filter: hue-rotate()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="hue-rotate-60 md:hue-rotate-0 ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
