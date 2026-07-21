---
title: 'backdrop-filter: sepia()'
description: Utilities for applying backdrop sepia filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 200
metadata:
  source: https://tailwindcss.com/docs/backdrop-filter-sepia
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# backdrop-filter: sepia()

Utilities for applying backdrop sepia filters to an element.

| Class | Styles |
| --- | --- |
| `backdrop-sepia` | `backdrop-filter: sepia(100%);` |
| `backdrop-sepia-<number>` | `backdrop-filter: sepia(<number>%);` |
| `backdrop-sepia-(<custom-property>)` | `backdrop-filter: sepia(var(<custom-property>));` |
| `backdrop-sepia-[<value>]` | `backdrop-filter: sepia(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `backdrop-sepia` and `backdrop-sepia-50` to control the sepia effect applied to an element's backdrop:

```
<div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-sepia-0 ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-sepia-50 ..."></div></div><div class="bg-[url(/img/mountains.jpg)]">  <div class="bg-white/30 backdrop-sepia ..."></div></div>
```

### [Using a custom value](#using-a-custom-value)

Use the `backdrop-sepia-[<value>]` syntax to set the backdrop sepia based on a completely custom value:

```
<div class="backdrop-sepia-[.25] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `backdrop-sepia-(<custom-property>)` syntax:

```
<div class="backdrop-sepia-(--my-backdrop-sepia) ...">  <!-- ... --></div>
```

This is just a shorthand for `backdrop-sepia-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `backdrop-filter: sepia()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="backdrop-sepia md:backdrop-sepia-0 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
