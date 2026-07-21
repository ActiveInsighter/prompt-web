---
title: scroll-snap-align
description: Utilities for controlling the scroll snap alignment of an element.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 150
metadata:
  source: https://tailwindcss.com/docs/scroll-snap-align
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scroll-snap-align

Utilities for controlling the scroll snap alignment of an element.

| Class | Styles |
| --- | --- |
| `snap-start` | `scroll-snap-align: start;` |
| `snap-end` | `scroll-snap-align: end;` |
| `snap-center` | `scroll-snap-align: center;` |
| `snap-align-none` | `scroll-snap-align: none;` |

## [Examples](#examples)

### [Snapping to the center](#snapping-to-the-center)

Use the `snap-center` utility to snap an element to its center when being scrolled inside a snap container:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x ...">  <div class="snap-center ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-05.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-06.jpg" />  </div></div>
```

### [Snapping to the start](#snapping-to-the-start)

Use the `snap-start` utility to snap an element to its start when being scrolled inside a snap container:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x ...">  <div class="snap-start ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-start ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-start ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-start ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-start ...">    <img src="/img/vacation-05.jpg" />  </div>  <div class="snap-start ...">    <img src="/img/vacation-06.jpg" />  </div></div>
```

### [Snapping to the end](#snapping-to-the-end)

Use the `snap-end` utility to snap an element to its end when being scrolled inside a snap container:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x ...">  <div class="snap-end ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-end ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-end ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-end ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-end ...">    <img src="/img/vacation-05.jpg" />  </div>  <div class="snap-end ...">    <img src="/img/vacation-06.jpg" />  </div></div>
```

### [Responsive design](#responsive-design)

Prefix a `scroll-snap-align` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="snap-center md:snap-start ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
