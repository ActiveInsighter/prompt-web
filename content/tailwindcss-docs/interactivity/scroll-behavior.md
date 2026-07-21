---
title: scroll-behavior
description: Utilities for controlling the scroll behavior of an element.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 90
metadata:
  source: https://tailwindcss.com/docs/scroll-behavior
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scroll-behavior

Utilities for controlling the scroll behavior of an element.

| Class | Styles |
| --- | --- |
| `scroll-auto` | `scroll-behavior: auto;` |
| `scroll-smooth` | `scroll-behavior: smooth;` |

## [Examples](#examples)

### [Using smooth scrolling](#using-smooth-scrolling)

Use the `scroll-smooth` utility to enable smooth scrolling within an element:

```
<html class="scroll-smooth">  <!-- ... --></html>
```

Setting the `scroll-behavior` only affects scroll events that are triggered by the browser.

### [Using normal scrolling](#using-normal-scrolling)

Use the `scroll-auto` utility to revert to the default browser behavior for scrolling:

```
<html class="scroll-smooth md:scroll-auto">  <!-- ... --></html>
```
