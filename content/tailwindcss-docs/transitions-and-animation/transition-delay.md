---
title: transition-delay
description: Utilities for controlling the delay of CSS transitions.
language: en-US
role: reference
tags:
- tailwindcss
- transitions-and-animation
sort: 50
metadata:
  source: https://tailwindcss.com/docs/transition-delay
  sidebar_group: Transitions & Animation
  section: Transitions & Animation
  collector: rendered-html
---

# transition-delay

Utilities for controlling the delay of CSS transitions.

| Class | Styles |
| --- | --- |
| `delay-<number>` | `transition-delay: <number>ms;` |
| `delay-(<custom-property>)` | `transition-delay: var(<custom-property>);` |
| `delay-[<value>]` | `transition-delay: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `delay-150` and `delay-700` to set the transition delay of an element in milliseconds:

Hover each button to see the expected behavior

```
<button class="transition delay-150 duration-300 ease-in-out ...">Button A</button><button class="transition delay-300 duration-300 ease-in-out ...">Button B</button><button class="transition delay-700 duration-300 ease-in-out ...">Button C</button>
```

### [Supporting reduced motion](#supporting-reduced-motion)

For situations where the user has specified that they prefer reduced motion, you can conditionally apply animations and transitions using the `motion-safe` and `motion-reduce` variants:

```
<button type="button" class="delay-300 motion-reduce:delay-0 ...">  <!-- ... --></button>
```

### [Using a custom value](#using-a-custom-value)

Use the `delay-[<value>]` syntax to set the transition delay based on a completely custom value:

```
<button class="delay-[1s,250ms] ...">  <!-- ... --></button>
```

For CSS variables, you can also use the `delay-(<custom-property>)` syntax:

```
<button class="delay-(--my-delay) ...">  <!-- ... --></button>
```

This is just a shorthand for `delay-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `transition-delay` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<button class="delay-150 md:delay-300 ...">  <!-- ... --></button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
