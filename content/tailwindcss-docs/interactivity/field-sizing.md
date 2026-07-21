---
title: field-sizing
description: Utilities for controlling the sizing of form controls.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 60
metadata:
  source: https://tailwindcss.com/docs/field-sizing
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# field-sizing

Utilities for controlling the sizing of form controls.

| Class | Styles |
| --- | --- |
| `field-sizing-fixed` | `field-sizing: fixed;` |
| `field-sizing-content` | `field-sizing: content;` |

## [Examples](#examples)

### [Sizing based on content](#sizing-based-on-content)

Use the `field-sizing-content` utility to allow a form control to adjust its size based on the content:

Type in the input below to see the size change

```
<textarea class="field-sizing-content ..." rows="2">  Latex Salesman, Vanderlay Industries</textarea>
```

### [Using a fixed size](#using-a-fixed-size)

Use the `field-sizing-fixed` utility to make a form control use a fixed size:

Type in the input below to see the size remain the same

```
<textarea class="field-sizing-fixed w-80 ..." rows="2">  Latex Salesman, Vanderlay Industries</textarea>
```

### [Responsive design](#responsive-design)

Prefix a `field-sizing` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<input class="field-sizing-content md:field-sizing-fixed ..." />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
