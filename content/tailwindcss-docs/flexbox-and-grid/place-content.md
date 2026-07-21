---
title: place-content
description: Utilities for controlling how content is justified and aligned at the
  same time.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 220
metadata:
  source: https://tailwindcss.com/docs/place-content
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# place-content

Utilities for controlling how content is justified and aligned at the same time.

| Class | Styles |
| --- | --- |
| `place-content-center` | `place-content: center;` |
| `place-content-center-safe` | `place-content: safe center;` |
| `place-content-start` | `place-content: start;` |
| `place-content-end` | `place-content: end;` |
| `place-content-end-safe` | `place-content: safe end;` |
| `place-content-between` | `place-content: space-between;` |
| `place-content-around` | `place-content: space-around;` |
| `place-content-evenly` | `place-content: space-evenly;` |
| `place-content-baseline` | `place-content: baseline;` |
| `place-content-stretch` | `place-content: stretch;` |

## [Examples](#examples)

### [Center](#center)

Use `place-content-center` to pack items in the center of the inline and block axes:

```
<div class="grid h-48 grid-cols-2 place-content-center gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Start](#start)

Use `place-content-start` to pack items against the start of the inline and block axes:

```
<div class="grid h-48 grid-cols-2 place-content-start gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [End](#end)

Use `place-content-end` to pack items against the end of the inline and block axes:

```
<div class="grid h-48 grid-cols-2 place-content-end gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Space between](#space-between)

Use `place-content-between` to distribute grid items along the inline and block axes so that there is an equal amount of space between each row and column on each axis respectively:

```
<div class="grid h-48 grid-cols-2 place-content-between gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Space around](#space-around)

Use `place-content-around` to distribute grid items along the inline and block axes so that there is an equal amount of space around each row and column on each axis respectively:

```
<div class="grid h-48 grid-cols-2 place-content-around gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Space evenly](#space-evenly)

Use `place-content-evenly` to distribute grid items such that they are evenly spaced on the inline and block axes:

```
<div class="grid h-48 grid-cols-2 place-content-evenly gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Stretch](#stretch)

Use `place-content-stretch` to stretch grid items along their grid areas on the inline and block axes:

```
<div class="grid h-48 grid-cols-2 place-content-stretch gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div></div>
```

### [Responsive design](#responsive-design)

Prefix a `place-content` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="grid place-content-start md:place-content-center ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
