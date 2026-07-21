---
title: overflow
description: Utilities for controlling how an element handles content that is too
  large for the container.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 140
metadata:
  source: https://tailwindcss.com/docs/overflow
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# overflow

Utilities for controlling how an element handles content that is too large for the container.

| Class | Styles |
| --- | --- |
| `overflow-auto` | `overflow: auto;` |
| `overflow-hidden` | `overflow: hidden;` |
| `overflow-clip` | `overflow: clip;` |
| `overflow-visible` | `overflow: visible;` |
| `overflow-scroll` | `overflow: scroll;` |
| `overflow-x-auto` | `overflow-x: auto;` |
| `overflow-y-auto` | `overflow-y: auto;` |
| `overflow-x-hidden` | `overflow-x: hidden;` |
| `overflow-y-hidden` | `overflow-y: hidden;` |
| `overflow-x-clip` | `overflow-x: clip;` |
| `overflow-y-clip` | `overflow-y: clip;` |
| `overflow-x-visible` | `overflow-x: visible;` |
| `overflow-y-visible` | `overflow-y: visible;` |
| `overflow-x-scroll` | `overflow-x: scroll;` |
| `overflow-y-scroll` | `overflow-y: scroll;` |

## [Examples](#examples)

### [Showing content that overflows](#showing-content-that-overflows)

Use the `overflow-visible` utility to prevent content within an element from being clipped:

```
<div class="overflow-visible ...">  <!-- ... --></div>
```

Note that any content that overflows the bounds of the element will then be visible.

### [Hiding content that overflows](#hiding-content-that-overflows)

Use the `overflow-hidden` utility to clip any content within an element that overflows the bounds of that element:

```
<div class="overflow-hidden ...">  <!-- ... --></div>
```

### [Scrolling if needed](#scrolling-if-needed)

Use the `overflow-auto` utility to add scrollbars to an element in the event that its content overflows the bounds of that element:

Scroll vertically

```
<div class="overflow-auto ...">  <!-- ... --></div>
```

Unlike `overflow-scroll`, which always shows scrollbars, this utility will only show them if scrolling is necessary.

### [Scrolling horizontally if needed](#scrolling-horizontally-if-needed)

Use the `overflow-x-auto` utility to allow horizontal scrolling if needed:

Scroll horizontally

```
<div class="overflow-x-auto ...">  <!-- ... --></div>
```

### [Scrolling vertically if needed](#scrolling-vertically-if-needed)

Use the `overflow-y-auto` utility to allow vertical scrolling if needed:

Scroll vertically

```
<div class="h-32 overflow-y-auto ...">  <!-- ... --></div>
```

### [Scrolling horizontally always](#scrolling-horizontally-always)

Use the `overflow-x-scroll` utility to allow horizontal scrolling and always show scrollbars unless always-visible scrollbars are disabled by the operating system:

Scroll horizontally

```
<div class="overflow-x-scroll ...">  <!-- ... --></div>
```

### [Scrolling vertically always](#scrolling-vertically-always)

Use the `overflow-y-scroll` utility to allow vertical scrolling and always show scrollbars unless always-visible scrollbars are disabled by the operating system:

Scroll vertically

```
<div class="overflow-y-scroll ...">  <!-- ... --></div>
```

### [Scrolling in all directions](#scrolling-in-all-directions)

Use the `overflow-scroll` utility to add scrollbars to an element:

Scroll vertically and horizontally

```
<div class="overflow-scroll ...">  <!-- ... --></div>
```

Unlike `overflow-auto`, which only shows scrollbars if they are necessary, this utility always shows them. Note that some operating systems (like macOS) hide unnecessary scrollbars regardless of this setting.

### [Responsive design](#responsive-design)

Prefix an `overflow` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="overflow-auto md:overflow-scroll ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
