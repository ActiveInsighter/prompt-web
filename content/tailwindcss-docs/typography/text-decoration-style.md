---
title: text-decoration-style
description: Utilities for controlling the style of text decorations.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 190
metadata:
  source: https://tailwindcss.com/docs/text-decoration-style
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-decoration-style

Utilities for controlling the style of text decorations.

| Class | Styles |
| --- | --- |
| `decoration-solid` | `text-decoration-style: solid;` |
| `decoration-double` | `text-decoration-style: double;` |
| `decoration-dotted` | `text-decoration-style: dotted;` |
| `decoration-dashed` | `text-decoration-style: dashed;` |
| `decoration-wavy` | `text-decoration-style: wavy;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `decoration-dotted` and `decoration-dashed` to change the [text decoration](https://tailwindcss.com/docs/text-decoration-line) style of an element:

```
<p class="underline decoration-solid">The quick brown fox...</p><p class="underline decoration-double">The quick brown fox...</p><p class="underline decoration-dotted">The quick brown fox...</p><p class="underline decoration-dashed">The quick brown fox...</p><p class="underline decoration-wavy">The quick brown fox...</p>
```

### [Responsive design](#responsive-design)

Prefix a `text-decoration-style` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="underline md:decoration-dashed ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
