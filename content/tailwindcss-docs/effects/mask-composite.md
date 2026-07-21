---
title: mask-composite
description: Utilities for controlling how multiple masks are combined together.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 70
metadata:
  source: https://tailwindcss.com/docs/mask-composite
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mask-composite

Utilities for controlling how multiple masks are combined together.

| Class | Styles |
| --- | --- |
| `mask-add` | `mask-composite: add;` |
| `mask-subtract` | `mask-composite: subtract;` |
| `mask-intersect` | `mask-composite: intersect;` |
| `mask-exclude` | `mask-composite: exclude;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `mask-add` and `mask-intersect` to control how an element's masks are combined together:

```
<div class="mask-add mask-[url(/img/circle.png),url(/img/circle.png)] mask-position-[30%_50%,70%_50%] bg-[url(/img/mountains.jpg)]"></div><div class="mask-subtract mask-[url(/img/circle.png),url(/img/circle.png)] mask-position-[30%_50%,70%_50%] bg-[url(/img/mountains.jpg)]"></div><div class="mask-intersect mask-[url(/img/circle.png),url(/img/circle.png)] mask-position-[30%_50%,70%_50%] bg-[url(/img/mountains.jpg)]"></div><div class="mask-exclude mask-[url(/img/circle.png),url(/img/circle.png)] mask-position-[30%_50%,70%_50%] bg-[url(/img/mountains.jpg)]"></div>
```

### [Responsive design](#responsive-design)

Prefix a `mask-composite` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mask-add md:mask-subtract ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
