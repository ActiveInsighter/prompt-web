---
title: text-indent
description: Utilities for controlling the amount of empty space shown before text
  in a block.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 250
metadata:
  source: https://tailwindcss.com/docs/text-indent
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-indent

Utilities for controlling the amount of empty space shown before text in a block.

| Class | Styles |
| --- | --- |
| `indent-<number>` | `text-indent: calc(var(--spacing) * <number>);` |
| `-indent-<number>` | `text-indent: calc(var(--spacing) * -<number>);` |
| `indent-px` | `text-indent: 1px;` |
| `-indent-px` | `text-indent: -1px;` |
| `indent-(<custom-property>)` | `text-indent: var(<custom-property>);` |
| `indent-[<value>]` | `text-indent: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `indent-<number>` utilities like `indent-2` and `indent-8` to set the amount of empty space (indentation) that's shown before text in a block:

```
<p class="indent-8">So I started to walk into the water...</p>
```

### [Using negative values](#using-negative-values)

To use a negative text indent value, prefix the class name with a dash to convert it to a negative value:

```
<p class="-indent-8">So I started to walk into the water...</p>
```

### [Using a custom value](#using-a-custom-value)

Use the `indent-[<value>]` syntax to set the text indentation based on a completely custom value:

```
<p class="indent-[50%] ...">  Lorem ipsum dolor sit amet...</p>
```

For CSS variables, you can also use the `indent-(<custom-property>)` syntax:

```
<p class="indent-(--my-indentation) ...">  Lorem ipsum dolor sit amet...</p>
```

This is just a shorthand for `indent-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `text-indent` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="indent-4 md:indent-8 ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
