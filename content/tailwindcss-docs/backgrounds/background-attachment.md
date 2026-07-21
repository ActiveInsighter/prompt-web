---
title: background-attachment
description: Utilities for controlling how a background image behaves when scrolling.
language: en-US
role: reference
tags:
- tailwindcss
- backgrounds
sort: 10
metadata:
  source: https://tailwindcss.com/docs/background-attachment
  sidebar_group: Backgrounds
  section: Backgrounds
  collector: rendered-html
---

# background-attachment

Utilities for controlling how a background image behaves when scrolling.

| Class | Styles |
| --- | --- |
| `bg-fixed` | `background-attachment: fixed;` |
| `bg-local` | `background-attachment: local;` |
| `bg-scroll` | `background-attachment: scroll;` |

## [Examples](#examples)

### [Fixing the background image](#fixing-the-background-image)

Use the `bg-fixed` utility to fix the background image relative to the viewport:

Scroll the content to see the background image fixed in place

```
<div class="bg-[url(/img/mountains.jpg)] bg-fixed ...">  <!-- ... --></div>
```

### [Scrolling with the container](#scrolling-with-the-container)

Use the `bg-local` utility to scroll the background image with the container and the viewport:

Scroll the content to see the background image scroll with the container

```
<div class="bg-[url(/img/mountains.jpg)] bg-local ...">  <!-- ... --></div>
```

### [Scrolling with the viewport](#scrolling-with-the-viewport)

Use the `bg-scroll` utility to scroll the background image with the viewport, but not with the container:

Scroll the content to see the background image fixed in the container

```
<div class="bg-[url(/img/mountains.jpg)] bg-scroll ...">  <!-- ... --></div>
```

### [Responsive design](#responsive-design)

Prefix a `background-attachment` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="bg-local md:bg-fixed ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
