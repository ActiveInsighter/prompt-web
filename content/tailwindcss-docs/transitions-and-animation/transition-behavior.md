---
title: transition-behavior
description: Utilities to control the behavior of CSS transitions.
language: en-US
role: reference
tags:
- tailwindcss
- transitions-and-animation
sort: 20
metadata:
  source: https://tailwindcss.com/docs/transition-behavior
  sidebar_group: Transitions & Animation
  section: Transitions & Animation
  collector: rendered-html
---

# transition-behavior

Utilities to control the behavior of CSS transitions.

| Class | Styles |
| --- | --- |
| `transition-normal` | `transition-behavior: normal;` |
| `transition-discrete` | `transition-behavior: allow-discrete;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `transition-discrete` utility to start transitions when changing properties with a discrete set of values, such as elements that change from `hidden` to `block`:

Interact with the checkboxes to see the expected behavior

```
<label class="peer ...">  <input type="checkbox" checked /></label><button class="hidden transition-all not-peer-has-checked:opacity-0 peer-has-checked:block ...">  I hide</button><label class="peer ...">  <input type="checkbox" checked /></label><button class="hidden transition-all transition-discrete not-peer-has-checked:opacity-0 peer-has-checked:block ...">  I fade out</button>
```

### [Responsive design](#responsive-design)

Prefix a `transition-behavior` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<button class="transition-discrete md:transition-normal ...">  <!-- ... --></button>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
