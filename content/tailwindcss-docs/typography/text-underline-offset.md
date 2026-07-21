---
title: text-underline-offset
description: Utilities for controlling the offset of a text underline.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 210
metadata:
  source: https://tailwindcss.com/docs/text-underline-offset
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-underline-offset

Utilities for controlling the offset of a text underline.

| Class | Styles |
| --- | --- |
| `underline-offset-<number>` | `text-underline-offset: <number>px;` |
| `-underline-offset-<number>` | `text-underline-offset: calc(<number>px * -1);` |
| `underline-offset-auto` | `text-underline-offset: auto;` |
| `underline-offset-(<custom-property>)` | `text-underline-offset: var(<custom-property>);` |
| `underline-offset-[<value>]` | `text-underline-offset: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `underline-offset-<number>` utilities like `underline-offset-2` and `underline-offset-4` to change the offset of a text underline:

```
<p class="underline underline-offset-1">The quick brown fox...</p><p class="underline underline-offset-2">The quick brown fox...</p><p class="underline underline-offset-4">The quick brown fox...</p><p class="underline underline-offset-8">The quick brown fox...</p>
```

### [Using a custom value](#using-a-custom-value)

Use the `underline-offset-[<value>]` syntax to set the text underline offset based on a completely custom value:

```
<p class="underline-offset-[3px] ...">  Lorem ipsum dolor sit amet...</p>
```

For CSS variables, you can also use the `underline-offset-(<custom-property>)` syntax:

```
<p class="underline-offset-(--my-underline-offset) ...">  Lorem ipsum dolor sit amet...</p>
```

This is just a shorthand for `underline-offset-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `text-underline-offset` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="underline md:underline-offset-4 ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
