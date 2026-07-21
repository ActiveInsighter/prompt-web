---
title: font-smoothing
description: Utilities for controlling the font smoothing of an element.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 30
metadata:
  source: https://tailwindcss.com/docs/font-smoothing
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# font-smoothing

Utilities for controlling the font smoothing of an element.

| Class | Styles |
| --- | --- |
| `antialiased` | `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` |
| `subpixel-antialiased` | `-webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto;` |

## [Examples](#examples)

### [Grayscale antialiasing](#grayscale-antialiasing)

Use the `antialiased` utility to render text using grayscale antialiasing:

```
<p class="antialiased ...">The quick brown fox ...</p>
```

### [Subpixel antialiasing](#subpixel-antialiasing)

Use the `subpixel-antialiased` utility to render text using subpixel antialiasing:

```
<p class="subpixel-antialiased ...">The quick brown fox ...</p>
```

### [Responsive design](#responsive-design)

Prefix `-webkit-font-smoothing` and `-moz-osx-font-smoothing` utilities with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="antialiased md:subpixel-antialiased ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
