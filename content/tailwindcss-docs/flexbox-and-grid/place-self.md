---
title: place-self
description: Utilities for controlling how an individual item is justified and aligned
  at the same time.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 240
metadata:
  source: https://tailwindcss.com/docs/place-self
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# place-self

Utilities for controlling how an individual item is justified and aligned at the same time.

| Class | Styles |
| --- | --- |
| `place-self-auto` | `place-self: auto;` |
| `place-self-start` | `place-self: start;` |
| `place-self-end` | `place-self: end;` |
| `place-self-end-safe` | `place-self: safe end;` |
| `place-self-center` | `place-self: center;` |
| `place-self-center-safe` | `place-self: safe center;` |
| `place-self-stretch` | `place-self: stretch;` |

## [Examples](#examples)

### [Auto](#auto)

Use `place-self-auto` to align an item based on the value of the container's `place-items` property:

```
<div class="grid grid-cols-3 gap-4 ...">  <div>01</div>  <div class="place-self-auto ...">02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [Start](#start)

Use `place-self-start` to align an item to the start on both axes:

```
<div class="grid grid-cols-3 gap-4 ...">  <div>01</div>  <div class="place-self-start ...">02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [Center](#center)

Use `place-self-center` to align an item at the center on both axes:

```
<div class="grid grid-cols-3 gap-4 ...">  <div>01</div>  <div class="place-self-center ...">02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [End](#end)

Use `place-self-end` to align an item to the end on both axes:

```
<div class="grid grid-cols-3 gap-4 ...">  <div>01</div>  <div class="place-self-end ...">02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [Stretch](#stretch)

Use `place-self-stretch` to stretch an item on both axes:

```
<div class="grid grid-cols-3 gap-4 ...">  <div>01</div>  <div class="place-self-stretch ...">02</div>  <div>03</div>  <div>04</div>  <div>05</div>  <div>06</div></div>
```

### [Responsive design](#responsive-design)

Prefix a `place-self` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="place-self-start md:place-self-end ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
