---
title: object-fit
description: Utilities for controlling how a replaced element's content should be
  resized.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 120
metadata:
  source: https://tailwindcss.com/docs/object-fit
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# object-fit

Utilities for controlling how a replaced element's content should be resized.

| Class | Styles |
| --- | --- |
| `object-contain` | `object-fit: contain;` |
| `object-cover` | `object-fit: cover;` |
| `object-fill` | `object-fit: fill;` |
| `object-none` | `object-fit: none;` |
| `object-scale-down` | `object-fit: scale-down;` |

## [Examples](#examples)

### [Resizing to cover](#resizing-to-cover)

Use the `object-cover` utility to resize an element's content to cover its container:

```
<img class="h-48 w-96 object-cover ..." src="/img/mountains.jpg" />
```

### [Containing within](#containing-within)

Use the `object-contain` utility to resize an element's content to stay contained within its container:

```
<img class="h-48 w-96 object-contain ..." src="/img/mountains.jpg" />
```

### [Stretching to fit](#stretching-to-fit)

Use the `object-fill` utility to stretch an element's content to fit its container:

```
<img class="h-48 w-96 object-fill ..." src="/img/mountains.jpg" />
```

### [Scaling down](#scaling-down)

Use the `object-scale-down` utility to display an element's content at its original size but scale it down to fit its container if necessary:

```
<img class="h-48 w-96 object-scale-down ..." src="/img/mountains.jpg" />
```

### [Using the original size](#using-the-original-size)

Use the `object-none` utility to display an element's content at its original size ignoring the container size:

```
<img class="h-48 w-96 object-none ..." src="/img/mountains.jpg" />
```

### [Responsive design](#responsive-design)

Prefix an `object-fit` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="object-contain md:object-cover" src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
