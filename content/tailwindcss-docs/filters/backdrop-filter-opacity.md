---
title: 'backdrop-filter: opacity()'
description: Utilities for applying backdrop opacity filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 180
metadata:
  source: https://tailwindcss.com/docs/backdrop-filter-opacity
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# backdrop-filter: opacity()

Utilities for applying backdrop opacity filters to an element.

| Class | Styles |
| --- | --- |
| `backdrop-opacity-<number>` | `backdrop-filter: opacity(<number>%);` |
| `backdrop-opacity-(<custom-property>)` | `backdrop-filter: opacity(var(<custom-property>));` |
| `backdrop-opacity-[<value>]` | `backdrop-filter: opacity(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `backdrop-opacity-50` and `backdrop-opacity-75` to control the opacity of all the backdrop filters applied to an element:

```
<div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-invert backdrop-opacity-10 ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-invert backdrop-opacity-60 ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-invert backdrop-opacity-95 ..."></div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `backdrop-opacity-[<value>]` syntax to set the backdrop filter opacity based on a completely custom value:

```
<div class="backdrop-opacity-[.15] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `backdrop-opacity-(<custom-property>)` syntax:

```
<div class="backdrop-opacity-(--my-backdrop-filter-opacity) ...">  <!-- ... --></div>
```

This is just a shorthand for `backdrop-opacity-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `backdrop-filter: opacity()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="backdrop-opacity-100 md:backdrop-opacity-60 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
