---
title: text-overflow
description: Utilities for controlling how the text of an element overflows.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 230
metadata:
  source: https://tailwindcss.com/docs/text-overflow
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-overflow

Utilities for controlling how the text of an element overflows.

| Class | Styles |
| --- | --- |
| `truncate` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` |
| `text-ellipsis` | `text-overflow: ellipsis;` |
| `text-clip` | `text-overflow: clip;` |

## [Examples](#examples)

### [Truncating text](#truncating-text)

Use the `truncate` utility to prevent text from wrapping and truncate overflowing text with an ellipsis (…) if needed:

```
<p class="truncate">The longest word in any of the major...</p>
```

### [Adding an ellipsis](#adding-an-ellipsis)

Use the `text-ellipsis` utility to truncate overflowing text with an ellipsis (…) if needed:

```
<p class="overflow-hidden text-ellipsis">The longest word in any of the major...</p>
```

### [Clipping text](#clipping-text)

Use the `text-clip` utility to truncate the text at the limit of the content area:

```
<p class="overflow-hidden text-clip">The longest word in any of the major...</p>
```

This is the default browser behavior.

### [Responsive design](#responsive-design)

Prefix a `text-overflow` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="text-ellipsis md:text-clip ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
