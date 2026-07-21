---
title: grid-auto-flow
description: Utilities for controlling how elements in a grid are auto-placed.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 120
metadata:
  source: https://tailwindcss.com/docs/grid-auto-flow
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# grid-auto-flow

Utilities for controlling how elements in a grid are auto-placed.

| Class | Styles |
| --- | --- |
| `grid-flow-row` | `grid-auto-flow: row;` |
| `grid-flow-col` | `grid-auto-flow: column;` |
| `grid-flow-dense` | `grid-auto-flow: dense;` |
| `grid-flow-row-dense` | `grid-auto-flow: row dense;` |
| `grid-flow-col-dense` | `grid-auto-flow: column dense;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `grid-flow-col` and `grid-flow-row-dense` to control how the auto-placement algorithm works for a grid layout:

```
<div class="grid grid-flow-row-dense grid-cols-3 grid-rows-3 ...">  <div class="col-span-2">01</div>  <div class="col-span-2">02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Responsive design](#responsive-design)

Prefix a `grid-auto-flow` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="grid grid-flow-col md:grid-flow-row ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
