---
title: font-feature-settings
description: Utilities for controlling advanced typographic features.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 80
metadata:
  source: https://tailwindcss.com/docs/font-feature-settings
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# font-feature-settings

Utilities for controlling advanced typographic features.

| Class | Styles |
| --- | --- |
| `font-features-[<value>]` | `font-feature-settings: <value>;` |
| `font-features-(<custom-property>)` | `font-feature-settings: var(<custom-property>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `font-features-[<value>]` utility to enable OpenType features in fonts that support them:

```
<p class="font-features-['smcp'] ...">This text uses small caps.</p>
```

### [Enabling multiple features](#enabling-multiple-features)

You can enable multiple OpenType features by separating them with commas:

```
<p class="font-features-['smcp','onum'] ...">This text uses small caps and oldstyle numbers.</p>
```

### [Using CSS variables](#using-css-variables)

Use the `font-features-(<custom-property>)` syntax to apply font feature settings from a CSS variable:

```
<p class="font-features-(--my-features) ...">  <!-- ... --></p>
```

### [Responsive design](#responsive-design)

Prefix a `font-feature-settings` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="font-features-['tnum'] md:font-features-['smcp'] ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
