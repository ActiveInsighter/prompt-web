---
title: text-decoration-line
description: Utilities for controlling the decoration of text.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 170
metadata:
  source: https://tailwindcss.com/docs/text-decoration-line
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-decoration-line

Utilities for controlling the decoration of text.

| Class | Styles |
| --- | --- |
| `underline` | `text-decoration-line: underline;` |
| `overline` | `text-decoration-line: overline;` |
| `line-through` | `text-decoration-line: line-through;` |
| `no-underline` | `text-decoration-line: none;` |

## [Examples](#examples)

### [Underling text](#underling-text)

Use the `underline` utility to add an underline to the text of an element:

```
<p class="underline">The quick brown fox...</p>
```

### [Adding an overline to text](#adding-an-overline-to-text)

Use the `overline` utility to add an overline to the text of an element:

```
<p class="overline">The quick brown fox...</p>
```

### [Adding a line through text](#adding-a-line-through-text)

Use the `line-through` utility to add a line through the text of an element:

```
<p class="line-through">The quick brown fox...</p>
```

### [Removing a line from text](#removing-a-line-from-text)

Use the `no-underline` utility to remove a line from the text of an element:

```
<p class="no-underline">The quick brown fox...</p>
```

### [Applying on hover](#applying-on-hover)

Prefix a `text-decoration-line` utility with a variant like `hover:*` to only apply the utility in that state:

Hover over the text to see the expected behavior

```
<p>The <a href="..." class="no-underline hover:underline ...">quick brown fox</a> jumps over the lazy dog.</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Responsive design](#responsive-design)

Prefix a `text-decoration-line` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<a class="no-underline md:underline ..." href="...">  <!-- ... --></a>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
