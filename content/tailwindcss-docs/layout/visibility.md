---
title: visibility
description: Utilities for controlling the visibility of an element.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 180
metadata:
  source: https://tailwindcss.com/docs/visibility
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# visibility

Utilities for controlling the visibility of an element.

| Class | Styles |
| --- | --- |
| `visible` | `visibility: visible;` |
| `invisible` | `visibility: hidden;` |
| `collapse` | `visibility: collapse;` |

## [Examples](#examples)

### [Making elements invisible](#making-elements-invisible)

Use the `invisible` utility to hide an element, but still maintain its place in the document, affecting the layout of other elements:

```
<div class="grid grid-cols-3 gap-4">  <div>01</div>  <div class="invisible ...">02</div>  <div>03</div></div>
```

To completely remove an element from the document, use the [display](https://tailwindcss.com/docs/display#hidden) property instead.

### [Collapsing elements](#collapsing-elements)

Use the `collapse` utility to hide table rows, row groups, columns, and column groups as if they were set to `display: none`, but without impacting the size of other rows and columns:

```
<table>  <thead>    <tr>      <th>Invoice #</th>      <th>Client</th>      <th>Amount</th>    </tr>  </thead>  <tbody>    <tr>      <td>#100</td>      <td>Pendant Publishing</td>      <td>$2,000.00</td>    </tr>    <tr class="collapse">      <td>#101</td>      <td>Kruger Industrial Smoothing</td>      <td>$545.00</td>    </tr>    <tr>      <td>#102</td>      <td>J. Peterman</td>      <td>$10,000.25</td>    </tr>  </tbody></table>
```

This makes it possible to dynamically toggle rows and columns without affecting the table layout.

### [Making elements visible](#making-elements-visible)

Use the `visible` utility to make an element visible:

```
<div class="grid grid-cols-3 gap-4">  <div>01</div>  <div class="visible ...">02</div>  <div>03</div></div>
```

This is mostly useful for undoing the `invisible` utility at different screen sizes.

### [Responsive design](#responsive-design)

Prefix a `visibility` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="visible md:invisible ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
