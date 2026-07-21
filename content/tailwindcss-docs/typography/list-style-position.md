---
title: list-style-position
description: Utilities for controlling the position of bullets and numbers in lists.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 130
metadata:
  source: https://tailwindcss.com/docs/list-style-position
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# list-style-position

Utilities for controlling the position of bullets and numbers in lists.

| Class | Styles |
| --- | --- |
| `list-inside` | `list-style-position: inside;` |
| `list-outside` | `list-style-position: outside;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `list-inside` and `list-outside` to control the position of the markers and text indentation in a list:

```
<ul class="list-inside">  <li>5 cups chopped Porcini mushrooms</li>  <!-- ... --></ul><ul class="list-outside">  <li>5 cups chopped Porcini mushrooms</li>  <!-- ... --></ul>
```

### [Responsive design](#responsive-design)

Prefix a `list-style-position` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<ul class="list-outside md:list-inside ...">  <!-- ... --></ul>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
