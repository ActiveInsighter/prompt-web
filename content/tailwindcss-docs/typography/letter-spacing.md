---
title: letter-spacing
description: Utilities for controlling the tracking, or letter spacing, of an element.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 90
metadata:
  source: https://tailwindcss.com/docs/letter-spacing
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# letter-spacing

Utilities for controlling the tracking, or letter spacing, of an element.

| Class | Styles |
| --- | --- |
| `tracking-tighter` | `letter-spacing: var(--tracking-tighter); /* -0.05em */` |
| `tracking-tight` | `letter-spacing: var(--tracking-tight); /* -0.025em */` |
| `tracking-normal` | `letter-spacing: var(--tracking-normal); /* 0em */` |
| `tracking-wide` | `letter-spacing: var(--tracking-wide); /* 0.025em */` |
| `tracking-wider` | `letter-spacing: var(--tracking-wider); /* 0.05em */` |
| `tracking-widest` | `letter-spacing: var(--tracking-widest); /* 0.1em */` |
| `tracking-(<custom-property>)` | `letter-spacing: var(<custom-property>);` |
| `tracking-[<value>]` | `letter-spacing: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use utilities like `tracking-tight` and `tracking-wide` to set the letter spacing of an element:

```
<p class="tracking-tight ...">The quick brown fox ...</p><p class="tracking-normal ...">The quick brown fox ...</p><p class="tracking-wide ...">The quick brown fox ...</p>
```

### [Using negative values](#using-negative-values)

Using negative values doesn't make a ton of sense with the named letter spacing scale Tailwind includes out of the box, but if you've customized your scale to use numbers it can be useful:

```
@theme {  --tracking-1: 0em;  --tracking-2: 0.025em;  --tracking-3: 0.05em;  --tracking-4: 0.1em;}
```

To use a negative letter spacing value, prefix the class name with a dash to convert it to a negative value:

```
<p class="-tracking-2">The quick brown fox ...</p>
```

### [Using a custom value](#using-a-custom-value)

Use the `tracking-[<value>]` syntax to set the letter spacing based on a completely custom value:

```
<p class="tracking-[.25em] ...">  Lorem ipsum dolor sit amet...</p>
```

For CSS variables, you can also use the `tracking-(<custom-property>)` syntax:

```
<p class="tracking-(--my-tracking) ...">  Lorem ipsum dolor sit amet...</p>
```

This is just a shorthand for `tracking-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `letter-spacing` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="tracking-tight md:tracking-wide ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--tracking-*` theme variables to customize the letter spacing utilities in your project:

```
@theme {  --tracking-tightest: -0.075em; }
```

Now the `tracking-tightest` utility can be used in your markup:

```
<p class="tracking-tightest">  Lorem ipsum dolor sit amet...</p>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
