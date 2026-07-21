---
title: scroll-snap-type
description: Utilities for controlling how strictly snap points are enforced in a
  snap container.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 170
metadata:
  source: https://tailwindcss.com/docs/scroll-snap-type
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scroll-snap-type

Utilities for controlling how strictly snap points are enforced in a snap container.

| Class | Styles |
| --- | --- |
| `snap-none` | `scroll-snap-type: none;` |
| `snap-x` | `scroll-snap-type: x var(--tw-scroll-snap-strictness);` |
| `snap-y` | `scroll-snap-type: y var(--tw-scroll-snap-strictness);` |
| `snap-both` | `scroll-snap-type: both var(--tw-scroll-snap-strictness);` |
| `snap-mandatory` | `--tw-scroll-snap-strictness: mandatory;` |
| `snap-proximity` | `--tw-scroll-snap-strictness: proximity;` |

## [Examples](#examples)

### [Horizontal scroll snapping](#horizontal-scroll-snapping)

Use the `snap-x` utility to enable horizontal scroll snapping within an element:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x ...">  <div class="snap-center ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-05.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-06.jpg" />  </div></div>
```

For scroll snapping to work, you need to also set the [scroll snap alignment](https://tailwindcss.com/docs/scroll-snap-align) on the children.

### [Mandatory scroll snapping](#mandatory-scroll-snapping)

Use the `snap-mandatory` utility to force a snap container to always come to rest on a snap point:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x snap-mandatory ...">  <div class="snap-center ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-05.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-06.jpg" />  </div></div>
```

### [Proximity scroll snapping](#proximity-scroll-snapping)

Use the `snap-proximity` utility to make a snap container come to rest on snap points that are close in proximity:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x snap-proximity ...">  <div class="snap-center ...">    <img src="/img/vacation-01.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-02.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-03.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-04.jpg" />  </div>  <div class="snap-center ...">    <img src="/img/vacation-05.jpg" />  </div></div>
```

### [Responsive design](#responsive-design)

Prefix a `scroll-snap-type` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="snap-none md:snap-x ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
