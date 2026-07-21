---
title: scrollbar-width
description: Utilities for controlling the width of an element's scrollbar.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 110
metadata:
  source: https://tailwindcss.com/docs/scrollbar-width
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scrollbar-width

Utilities for controlling the width of an element's scrollbar.

| Class | Styles |
| --- | --- |
| `scrollbar-auto` | `scrollbar-width: auto;` |
| `scrollbar-thin` | `scrollbar-width: thin;` |
| `scrollbar-none` | `scrollbar-width: none;` |

## [Examples](#examples)

### [Using the default scrollbar width](#using-the-default-scrollbar-width)

Use the `scrollbar-auto` utility to use the browser's default scrollbar width:

```
<div class="scrollbar-auto overflow-auto ...">  <!-- ... --></div>
```

### [Using a thin scrollbar](#using-a-thin-scrollbar)

Use the `scrollbar-thin` utility to use a thinner scrollbar:

Scroll vertically

```
<div class="scrollbar-thin overflow-auto ...">  <!-- ... --></div>
```

### [Hiding scrollbars](#hiding-scrollbars)

Use the `scrollbar-none` utility to hide scrollbars while still allowing an element to scroll:

```
<div class="scrollbar-none overflow-auto ...">  <!-- ... --></div>
```

These utilities only support the browser keywords `auto`, `thin`, and `none`.

### [Responsive design](#responsive-design)

Prefix a `scrollbar-width` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="scrollbar-none md:scrollbar-auto ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
