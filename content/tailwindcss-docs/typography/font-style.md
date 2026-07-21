---
title: font-style
description: Utilities for controlling the style of text.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 40
metadata:
  source: https://tailwindcss.com/docs/font-style
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# font-style

Utilities for controlling the style of text.

| Class | Styles |
| --- | --- |
| `italic` | `font-style: italic;` |
| `not-italic` | `font-style: normal;` |

## [Examples](#examples)

### [Italicizing text](#italicizing-text)

Use the `italic` utility to make text italic:

```
<p class="italic ...">The quick brown fox ...</p>
```

### [Displaying text normally](#displaying-text-normally)

Use the `not-italic` utility to display text normally:

```
<p class="not-italic ...">The quick brown fox ...</p>
```

### [Responsive design](#responsive-design)

Prefix a `font-style` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="italic md:not-italic ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
