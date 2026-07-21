---
title: transition-timing-function
description: Utilities for controlling the easing of CSS transitions.
language: en-US
role: reference
tags:
- tailwindcss
- transitions-and-animation
sort: 40
metadata:
  source: https://tailwindcss.com/docs/transition-timing-function
  sidebar_group: Transitions & Animation
  section: Transitions & Animation
  collector: rendered-html
---

# transition-timing-function

Utilities for controlling the easing of CSS transitions.

| Class | Styles |
| --- | --- |
| `ease-linear` | `transition-timing-function: linear;` |
| `ease-in` | `transition-timing-function: var(--ease-in); /* cubic-bezier(0.4, 0, 1, 1) */` |
| `ease-out` | `transition-timing-function: var(--ease-out); /* cubic-bezier(0, 0, 0.2, 1) */` |
| `ease-in-out` | `transition-timing-function: var(--ease-in-out); /* cubic-bezier(0.4, 0, 0.2, 1) */` |
| `ease-initial` | `transition-timing-function: initial;` |
| `ease-(<custom-property>)` | `transition-timing-function: var(<custom-property>);` |
| `ease-[<value>]` | `transition-timing-function: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `ease-in` and `ease-out` to control the easing curve of an element's transition:

Hover each button to see the expected behavior

```
<button class="duration-300 ease-in ...">Button A</button><button class="duration-300 ease-out ...">Button B</button><button class="duration-300 ease-in-out ...">Button C</button>
```

### [Using a custom value](#using-a-custom-value)

Use the `ease-[<value>]` syntax to set the transition timing function based on a completely custom value:

```
<button class="ease-[cubic-bezier(0.95,0.05,0.795,0.035)] ...">  <!-- ... --></button>
```

For CSS variables, you can also use the `ease-(<custom-property>)` syntax:

```
<button class="ease-(--my-ease) ...">  <!-- ... --></button>
```

This is just a shorthand for `ease-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `transition-timing-function` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<button class="ease-out md:ease-in ...">  <!-- ... --></button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--ease-*` theme variables to customize the transition timing function utilities in your project:

```
@theme {  --ease-in-expo: cubic-bezier(0.95, 0.05, 0.795, 0.035); }
```

Now the `ease-in-expo` utility can be used in your markup:

```
<button class="ease-in-expo">  <!-- ... --></button>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
