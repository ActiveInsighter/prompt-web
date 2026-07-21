---
title: position
description: Utilities for controlling how an element is positioned in the document.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 160
metadata:
  source: https://tailwindcss.com/docs/position
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# position

Utilities for controlling how an element is positioned in the document.

| Class | Styles |
| --- | --- |
| `static` | `position: static;` |
| `fixed` | `position: fixed;` |
| `absolute` | `position: absolute;` |
| `relative` | `position: relative;` |
| `sticky` | `position: sticky;` |

## [Examples](#examples)

### [Statically positioning elements](#statically-positioning-elements)

Use the `static` utility to position an element according to the normal flow of the document:

```
<div class="static ...">  <p>Static parent</p>  <div class="absolute bottom-0 left-0 ...">    <p>Absolute child</p>  </div></div>
```

With statically positioned elements, any [offsets](https://tailwindcss.com/docs/top-right-bottom-left) will be ignored and the element will not act as a position reference for absolutely positioned children.

### [Relatively positioning elements](#relatively-positioning-elements)

Use the `relative` utility to position an element according to the normal flow of the document:

```
<div class="relative ...">  <p>Relative parent</p>  <div class="absolute bottom-0 left-0 ...">    <p>Absolute child</p>  </div></div>
```

With relatively position elements, any [offsets](https://tailwindcss.com/docs/top-right-bottom-left) are calculated relative to the element's normal position and the element will act as a position reference for absolutely positioned children.

### [Absolutely positioning elements](#absolutely-positioning-elements)

Use the `absolute` utility to position an element *outside* of the normal flow of the document, causing neighboring elements to act as if the element doesn't exist:

```
<div class="static ...">  <!-- Static parent -->  <div class="static ..."><p>Static child</p></div>  <div class="inline-block ..."><p>Static sibling</p></div>  <!-- Static parent -->  <div class="absolute ..."><p>Absolute child</p></div>  <div class="inline-block ..."><p>Static sibling</p></div></div>
```

With absolutely positioned elements, any [offsets](https://tailwindcss.com/docs/top-right-bottom-left) are calculated relative to the nearest parent that has a position other than `static`, and the element will act as a position reference for other absolutely positioned children.

### [Fixed positioning elements](#fixed-positioning-elements)

Use the `fixed` utility to position an element relative to the browser window:

Scroll this element to see the fixed positioning in action

```
<div class="relative">  <div class="fixed top-0 right-0 left-0">Contacts</div>  <div>    <div>      <img src="/img/andrew.jpg" />      <strong>Andrew Alfred</strong>    </div>    <div>      <img src="/img/debra.jpg" />      <strong>Debra Houston</strong>    </div>    <!-- ... -->  </div></div>
```

With fixed positioned elements, any [offsets](https://tailwindcss.com/docs/top-right-bottom-left) are calculated relative to the viewport and the element will act as a position reference for absolutely positioned children:

### [Sticky positioning elements](#sticky-positioning-elements)

Use the `sticky` utility to position an element as `relative` until it crosses a specified threshold, then treat it as `fixed` until its parent is off screen:

Scroll this element to see the sticky positioning in action

```
<div>  <div>    <div class="sticky top-0 ...">A</div>    <div>      <div>        <img src="/img/andrew.jpg" />        <strong>Andrew Alfred</strong>      </div>      <div>        <img src="/img/aisha.jpg" />        <strong>Aisha Houston</strong>      </div>      <!-- ... -->    </div>  </div>  <div>    <div class="sticky top-0">B</div>    <div>      <div>        <img src="/img/bob.jpg" />        <strong>Bob Alfred</strong>      </div>      <!-- ... -->    </div>  </div>  <!-- ... --></div>
```

With sticky positioned elements, any [offsets](https://tailwindcss.com/docs/top-right-bottom-left) are calculated relative to the element's normal position and the element will act as a position reference for absolutely positioned children.

### [Responsive design](#responsive-design)

Prefix a `position` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="relative md:absolute ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
