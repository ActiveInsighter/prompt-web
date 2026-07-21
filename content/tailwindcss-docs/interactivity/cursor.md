---
title: cursor
description: Utilities for controlling the cursor style when hovering over an element.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 50
metadata:
  source: https://tailwindcss.com/docs/cursor
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# cursor

Utilities for controlling the cursor style when hovering over an element.

| Class | Styles |
| --- | --- |
| `cursor-auto` | `cursor: auto;` |
| `cursor-default` | `cursor: default;` |
| `cursor-pointer` | `cursor: pointer;` |
| `cursor-wait` | `cursor: wait;` |
| `cursor-text` | `cursor: text;` |
| `cursor-move` | `cursor: move;` |
| `cursor-help` | `cursor: help;` |
| `cursor-not-allowed` | `cursor: not-allowed;` |
| `cursor-none` | `cursor: none;` |
| `cursor-context-menu` | `cursor: context-menu;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `cursor-pointer` and `cursor-grab` to control which cursor is displayed when hovering over an element:

Hover over each button to see the cursor change

```
<button class="cursor-pointer ...">Submit</button><button class="cursor-progress ...">Saving...</button><button class="cursor-not-allowed ..." disabled>Confirm</button>
```

### [Using a custom value](#using-a-custom-value)

Use the `cursor-[<value>]` syntax to set the cursor based on a completely custom value:

```
<button class="cursor-[url(hand.cur),_pointer] ...">  <!-- ... --></button>
```

For CSS variables, you can also use the `cursor-(<custom-property>)` syntax:

```
<button class="cursor-(--my-cursor) ...">  <!-- ... --></button>
```

This is just a shorthand for `cursor-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `cursor` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<button class="cursor-not-allowed md:cursor-auto ...">  <!-- ... --></button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
