---
title: align-content
description: Utilities for controlling how rows are positioned in multi-row flex and
  grid containers.
language: en-US
role: reference
tags:
- tailwindcss
- flexbox-and-grid
sort: 190
metadata:
  source: https://tailwindcss.com/docs/align-content
  sidebar_group: Flexbox & Grid
  section: Flexbox & Grid
  collector: rendered-html
---

# align-content

Utilities for controlling how rows are positioned in multi-row flex and grid containers.

| Class | Styles |
| --- | --- |
| `content-normal` | `align-content: normal;` |
| `content-center` | `align-content: center;` |
| `content-start` | `align-content: flex-start;` |
| `content-end` | `align-content: flex-end;` |
| `content-between` | `align-content: space-between;` |
| `content-around` | `align-content: space-around;` |
| `content-evenly` | `align-content: space-evenly;` |
| `content-baseline` | `align-content: baseline;` |
| `content-stretch` | `align-content: stretch;` |

## [Examples](#examples)

### [Start](#start)

Use `content-start` to pack rows in a container against the start of the cross axis:

```
<div class="grid h-56 grid-cols-3 content-start gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Center](#center)

Use `content-center` to pack rows in a container in the center of the cross axis:

```
<div class="grid h-56 grid-cols-3 content-center gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [End](#end)

Use `content-end` to pack rows in a container against the end of the cross axis:

```
<div class="grid h-56 grid-cols-3 content-end gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Space between](#space-between)

Use `content-between` to distribute rows in a container such that there is an equal amount of space between each line:

```
<div class="grid h-56 grid-cols-3 content-between gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Space around](#space-around)

Use `content-around` to distribute rows in a container such that there is an equal amount of space around each line:

```
<div class="grid h-56 grid-cols-3 content-around gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Space evenly](#space-evenly)

Use `content-evenly` to distribute rows in a container such that there is an equal amount of space around each item, but also accounting for the doubling of space you would normally see between each item when using `content-around`:

```
<div class="grid h-56 grid-cols-3 content-evenly gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Stretch](#stretch)

Use `content-stretch` to allow content items to fill the available space along the container’s cross axis:

```
<div class="grid h-56 grid-cols-3 content-stretch gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Normal](#normal)

Use `content-normal` to pack content items in their default position as if no `align-content` value was set:

```
<div class="grid h-56 grid-cols-3 content-normal gap-4 ...">  <div>01</div>  <div>02</div>  <div>03</div>  <div>04</div>  <div>05</div></div>
```

### [Responsive design](#responsive-design)

Prefix an `align-content` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="grid content-start md:content-around ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
