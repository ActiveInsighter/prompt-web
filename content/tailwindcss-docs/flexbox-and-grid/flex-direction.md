---
title: flex-direction
description: Utilities for controlling the direction of flex items.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 20
metadata:
  source: https://tailwindcss.com/docs/flex-direction
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# flex-direction

Utilities for controlling the direction of flex items.

| Class | Styles |
| --- | --- |
| `flex-row` | `flex-direction: row;` |
| `flex-row-reverse` | `flex-direction: row-reverse;` |
| `flex-col` | `flex-direction: column;` |
| `flex-col-reverse` | `flex-direction: column-reverse;` |

## [Examples](#examples)

### [Row](#row)

Use `flex-row` to position flex items horizontally in the same direction as text:

```
<div class="flex flex-row ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Row reversed](#row-reversed)

Use `flex-row-reverse` to position flex items horizontally in the opposite direction:

```
<div class="flex flex-row-reverse ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Column](#column)

Use `flex-col` to position flex items vertically:

```
<div class="flex flex-col ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Column reversed](#column-reversed)

Use `flex-col-reverse` to position flex items vertically in the opposite direction:

```
<div class="flex flex-col-reverse ...">  <div>01</div>  <div>02</div>  <div>03</div></div>
```

### [Responsive design](#responsive-design)

Prefix a `flex-direction` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="flex flex-col md:flex-row ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
