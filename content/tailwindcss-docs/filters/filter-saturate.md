---
title: 'filter: saturate()'
description: Utilities for applying saturation filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 90
metadata:
  source: https://tailwindcss.com/docs/filter-saturate
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# filter: saturate()

Utilities for applying saturation filters to an element.

| Class | Styles |
| --- | --- |
| `saturate-<number>` | `filter: saturate(<number>%);` |
| `saturate-(<custom-property>)` | `filter: saturate(var(<custom-property>));` |
| `saturate-[<value>]` | `filter: saturate(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `saturate-50` and `saturate-100` to control an element's saturation:

```
<img class="saturate-50 ..." src="/img/mountains.jpg" /><img class="saturate-100 ..." src="/img/mountains.jpg" /><img class="saturate-150 ..." src="/img/mountains.jpg" /><img class="saturate-200 ..." src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `saturate-[<value>]` syntax to set the saturation based on a completely custom value:

```
<img class="saturate-[.25] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `saturate-(<custom-property>)` syntax:

```
<img class="saturate-(--my-saturation) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `saturate-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `filter: saturate()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="saturate-50 md:saturate-150 ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
