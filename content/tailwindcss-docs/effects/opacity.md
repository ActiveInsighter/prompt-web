---
title: opacity
description: Utilities for controlling the opacity of an element.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 30
metadata:
  source: https://tailwindcss.com/docs/opacity
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# opacity

Utilities for controlling the opacity of an element.

| Class | Styles |
| --- | --- |
| `opacity-<number>` | `opacity: <number>%;` |
| `opacity-(<custom-property>)` | `opacity: var(<custom-property>);` |
| `opacity-[<value>]` | `opacity: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `opacity-<number>` utilities like `opacity-25` and `opacity-100` to set the opacity of an element:

```
<button class="bg-indigo-500 opacity-100 ..."></button><button class="bg-indigo-500 opacity-75 ..."></button><button class="bg-indigo-500 opacity-50 ..."></button><button class="bg-indigo-500 opacity-25 ..."></button>
```

### [Applying conditionally](#applying-conditionally)

Prefix an `opacity` utility with a variant like `disabled:*` to only apply the utility in that state:

```
<input class="opacity-100 disabled:opacity-75 ..." type="text" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Using a custom value](#using-a-custom-value)

Use the `opacity-[<value>]` syntax to set the opacity based on a completely custom value:

```
<button class="opacity-[.67] ...">  <!-- ... --></button>
```

For CSS variables, you can also use the `opacity-(<custom-property>)` syntax:

```
<button class="opacity-(--my-opacity) ...">  <!-- ... --></button>
```

This is just a shorthand for `opacity-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix an `opacity` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<button class="opacity-50 md:opacity-100 ...">  <!-- ... --></button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
