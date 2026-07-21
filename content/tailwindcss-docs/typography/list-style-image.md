---
title: list-style-image
description: Utilities for controlling the marker images for list items.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 120
metadata:
  source: https://tailwindcss.com/docs/list-style-image
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# list-style-image

Utilities for controlling the marker images for list items.

| Class | Styles |
| --- | --- |
| `list-image-[<value>]` | `list-style-image: <value>;` |
| `list-image-(<custom-property>)` | `list-style-image: var(<custom-property>);` |
| `list-image-none` | `list-style-image: none;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `list-image-[<value>]` syntax to control the marker image for list items:

```
<ul class="list-image-[url(/img/checkmark.png)]">  <li>5 cups chopped Porcini mushrooms</li>  <!-- ... --></ul>
```

### [Using a CSS variable](#using-a-css-variable)

Use the `list-image-(<custom-property>)` syntax to control the marker image for list items using a CSS variable:

```
<ul class="list-image-(--my-list-image)">  <!-- ... --></ul>
```

This is just a shorthand for `list-image-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Removing a marker image](#removing-a-marker-image)

Use the `list-image-none` utility to remove an existing marker image from list items:

```
<ul class="list-image-none">  <!-- ... --></ul>
```

### [Responsive design](#responsive-design)

Prefix a `list-style-image` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<ul class="list-image-none md:list-image-[url(/img/checkmark.png)] ...">  <!-- ... --></ul>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
