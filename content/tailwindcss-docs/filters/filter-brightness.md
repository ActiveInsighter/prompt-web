---
title: 'filter: brightness()'
description: Utilities for applying brightness filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 30
metadata:
  source: https://tailwindcss.com/docs/filter-brightness
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# filter: brightness()

Utilities for applying brightness filters to an element.

| Class | Styles |
| --- | --- |
| `brightness-<number>` | `filter: brightness(<number>%);` |
| `brightness-(<custom-property>)` | `filter: brightness(var(<custom-property>));` |
| `brightness-[<value>]` | `filter: brightness(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `brightness-50` and `brightness-100` to control an element's brightness:

```
<img class="brightness-50 ..." src="/img/mountains.jpg" /><img class="brightness-100 ..." src="/img/mountains.jpg" /><img class="brightness-125 ..." src="/img/mountains.jpg" /><img class="brightness-200 ..." src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `brightness-[<value>]` syntax to set the brightness based on a completely custom value:

```
<img class="brightness-[1.75] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `brightness-(<custom-property>)` syntax:

```
<img class="brightness-(--my-brightness) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `brightness-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `filter: brightness()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="brightness-110 md:brightness-150 ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
