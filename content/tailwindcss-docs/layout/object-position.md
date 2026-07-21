---
title: object-position
description: Utilities for controlling how a replaced element's content should be
  positioned within its container.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 130
metadata:
  source: https://tailwindcss.com/docs/object-position
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# object-position

Utilities for controlling how a replaced element's content should be positioned within its container.

| Class | Styles |
| --- | --- |
| `object-top-left` | `object-position: top left;` |
| `object-top` | `object-position: top;` |
| `object-top-right` | `object-position: top right;` |
| `object-left` | `object-position: left;` |
| `object-center` | `object-position: center;` |
| `object-right` | `object-position: right;` |
| `object-bottom-left` | `object-position: bottom left;` |
| `object-bottom` | `object-position: bottom;` |
| `object-bottom-right` | `object-position: bottom right;` |
| `object-(<custom-property>)` | `object-position: var(<custom-property>);` |
| `object-[<value>]` | `object-position: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `object-left` and `object-bottom-right` to specify how a replaced element's content should be positioned within its container:

Hover over examples to see the full image

```
<img class="size-24 object-top-left ..." src="/img/mountains.jpg" /><img class="size-24 object-top ..." src="/img/mountains.jpg" /><img class="size-24 object-top-right ..." src="/img/mountains.jpg" /><img class="size-24 object-left ..." src="/img/mountains.jpg" /><img class="size-24 object-center ..." src="/img/mountains.jpg" /><img class="size-24 object-right ..." src="/img/mountains.jpg" /><img class="size-24 object-bottom-left ..." src="/img/mountains.jpg" /><img class="size-24 object-bottom ..." src="/img/mountains.jpg" /><img class="size-24 object-bottom-right ..." src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `object-[<value>]` syntax to set the object position based on a completely custom value:

```
<img class="object-[25%_75%] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `object-(<custom-property>)` syntax:

```
<img class="object-(--my-object) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `object-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix an `object-position` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="object-center md:object-top ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
