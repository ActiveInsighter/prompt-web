---
title: 'filter: contrast()'
description: Utilities for applying contrast filters to an element.
language: en-US
role: reference
tags:
- tailwindcss
- filters
sort: 40
metadata:
  source: https://tailwindcss.com/docs/filter-contrast
  sidebar_group: Filters
  section: Filters
  collector: rendered-html
---

# filter: contrast()

Utilities for applying contrast filters to an element.

| Class | Styles |
| --- | --- |
| `contrast-<number>` | `filter: contrast(<number>%);` |
| `contrast-(<custom-property>)` | `filter: contrast(var(<custom-property>));` |
| `contrast-[<value>]` | `filter: contrast(<value>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `contrast-50` and `contrast-100` to control an element's contrast:

```
<img class="contrast-50 ..." src="/img/mountains.jpg" /><img class="contrast-100 ..." src="/img/mountains.jpg" /><img class="contrast-125 ..." src="/img/mountains.jpg" /><img class="contrast-200 ..." src="/img/mountains.jpg" />
```

### [Using a custom value](#using-a-custom-value)

Use the `contrast-[<value>]` syntax to set the contrast based on a completely custom value:

```
<img class="contrast-[.25] ..." src="/img/mountains.jpg" />
```

For CSS variables, you can also use the `contrast-(<custom-property>)` syntax:

```
<img class="contrast-(--my-contrast) ..." src="/img/mountains.jpg" />
```

This is just a shorthand for `contrast-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `filter: contrast()` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<img class="contrast-125 md:contrast-150 ..." src="/img/mountains.jpg" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
