---
title: scrollbar-gutter
description: Utilities for controlling the gutter space reserved for an element's
  scrollbar.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 120
metadata:
  source: https://tailwindcss.com/docs/scrollbar-gutter
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scrollbar-gutter

Utilities for controlling the gutter space reserved for an element's scrollbar.

| Class | Styles |
| --- | --- |
| `scrollbar-gutter-auto` | `scrollbar-gutter: auto;` |
| `scrollbar-gutter-stable` | `scrollbar-gutter: stable;` |
| `scrollbar-gutter-both` | `scrollbar-gutter: stable both-edges;` |

## [Examples](#examples)

### [Reserving space for the scrollbar](#reserving-space-for-the-scrollbar)

Use the `scrollbar-gutter-stable` utility to reserve space for the scrollbar even when an element isn't overflowing:

```
<div class="scrollbar-gutter-stable overflow-auto ...">  <!-- ... --></div>
```

### [Reserving space on both sides](#reserving-space-on-both-sides)

Use the `scrollbar-gutter-both` utility to reserve matching gutter space on both sides of the element:

```
<div class="scrollbar-gutter-both overflow-auto ...">  <!-- ... --></div>
```

### [Using the default gutter](#using-the-default-gutter)

Use the `scrollbar-gutter-auto` utility to only reserve gutter space when the browser would normally show a scrollbar:

```
<div class="scrollbar-gutter-auto overflow-auto ...">  <!-- ... --></div>
```

### [Responsive design](#responsive-design)

Prefix a `scrollbar-gutter` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="scrollbar-gutter-auto md:scrollbar-gutter-stable ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
