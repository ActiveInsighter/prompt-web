---
title: justify-items
description: Utilities for controlling how grid items are aligned along their inline
  axis.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 170
metadata:
  source: https://tailwindcss.com/docs/justify-items
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# justify-items

Utilities for controlling how grid items are aligned along their inline axis.

| Class | Styles |
| --- | --- |
| `justify-items-start` | `justify-items: start;` |
| `justify-items-end` | `justify-items: end;` |
| `justify-items-end-safe` | `justify-items: safe end;` |
| `justify-items-center` | `justify-items: center;` |
| `justify-items-center-safe` | `justify-items: safe center;` |
| `justify-items-stretch` | `justify-items: stretch;` |
| `justify-items-normal` | `justify-items: normal;` |

## [Examples](#examples)

### [Start](#start)

Use the `justify-items-start` utility to justify grid items against the start of their inline axis:

```
<div class="grid justify-items-start ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [End](#end)

Use the `justify-items-end` or `justify-items-end-safe` utilities to justify grid items against the end of their inline axis:

Resize the container to see the alignment behavior

```
<div class="grid grid-flow-col justify-items-end ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

```
<div class="grid grid-flow-col justify-items-end-safe ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

When there is not enough space available, the `justify-items-end-safe` utility will align items to the start of the container instead of the end.

### [Center](#center)

Use the `justify-items-center` or `justify-items-center-safe` utilities to justify grid items against the end of their inline axis:

Resize the container to see the alignment behavior

```
<div class="grid grid-flow-col justify-items-center ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

```
<div class="grid grid-flow-col justify-items-center-safe ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

When there is not enough space available, the `justify-items-center-safe` utility will align items to the start of the container instead of the center.

### [Stretch](#stretch)

Use the `justify-items-stretch` utility to stretch items along their inline axis:

```
<div class="grid justify-items-stretch ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [Responsive design](#responsive-design)

Prefix a `justify-items` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="grid justify-items-start md:justify-items-center ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
