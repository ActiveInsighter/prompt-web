---
title: top / right / bottom / left
description: Utilities for controlling the placement of positioned elements.
language: en-US
role: reference
tags:
- tailwindcss
- layout
sort: 170
metadata:
  source: https://tailwindcss.com/docs/top-right-bottom-left
  sidebar_group: Layout
  section: Layout
  collector: rendered-html
---

# top / right / bottom / left

Utilities for controlling the placement of positioned elements.

| Class | Styles |
| --- | --- |
| `inset-<number>` | `inset: calc(var(--spacing) * <number>);` |
| `-inset-<number>` | `inset: calc(var(--spacing) * -<number>);` |
| `inset-<fraction>` | `inset: calc(<fraction> * 100%);` |
| `-inset-<fraction>` | `inset: calc(<fraction> * -100%);` |
| `inset-px` | `inset: 1px;` |
| `-inset-px` | `inset: -1px;` |
| `inset-full` | `inset: 100%;` |
| `-inset-full` | `inset: -100%;` |
| `inset-auto` | `inset: auto;` |
| `inset-(<custom-property>)` | `inset: var(<custom-property>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `top-<number>`, `right-<number>`, `bottom-<number>`, `left-<number>`, and `inset-<number>` utilities like `top-0` and `bottom-4` to set the horizontal or vertical position of a [positioned element](https://tailwindcss.com/docs/position):

```
<!-- Pin to top left corner --><div class="relative size-32 ...">  <div class="absolute top-0 left-0 size-16 ...">01</div></div><!-- Span top edge --><div class="relative size-32 ...">  <div class="absolute inset-x-0 top-0 h-16 ...">02</div></div><!-- Pin to top right corner --><div class="relative size-32 ...">  <div class="absolute top-0 right-0 size-16 ...">03</div></div><!-- Span left edge --><div class="relative size-32 ...">  <div class="absolute inset-y-0 left-0 w-16 ...">04</div></div><!-- Fill entire parent --><div class="relative size-32 ...">  <div class="absolute inset-0 ...">05</div></div><!-- Span right edge --><div class="relative size-32 ...">  <div class="absolute inset-y-0 right-0 w-16 ...">06</div></div><!-- Pin to bottom left corner --><div class="relative size-32 ...">  <div class="absolute bottom-0 left-0 size-16 ...">07</div></div><!-- Span bottom edge --><div class="relative size-32 ...">  <div class="absolute inset-x-0 bottom-0 h-16 ...">08</div></div><!-- Pin to bottom right corner --><div class="relative size-32 ...">  <div class="absolute right-0 bottom-0 size-16 ...">09</div></div>
```

### [Using negative values](#using-negative-values)

To use a negative top/right/bottom/left value, prefix the class name with a dash to convert it to a negative value:

```
<div class="relative size-32 ...">  <div class="absolute -top-4 -left-4 size-14 ..."></div></div>
```

### [Using logical properties](#using-logical-properties)

Use `inset-s-<number>` or `inset-e-<number>` utilities like `inset-s-0` and `inset-e-4` to set the `inset-inline-start` and `inset-inline-end` [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties/Basic_concepts), which map to either the left or right side based on the text direction:

```
<div dir="ltr">  <div class="relative size-32 ...">    <div class="absolute inset-s-0 top-0 size-14 ..."></div>  </div>  <div>    <div dir="rtl">      <div class="relative size-32 ...">        <div class="absolute inset-s-0 top-0 size-14 ..."></div>      </div>      <div></div>    </div>  </div></div>
```

For more control, you can also use the [LTR and RTL modifiers](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support) to conditionally apply specific styles depending on the current text direction.

### [Using a custom value](#using-a-custom-value)

Use utilities like `inset-[<value>]` and `top-[<value>]` to set the position based on a completely custom value:

```
<div class="inset-[3px] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `inset-(<custom-property>)` syntax:

```
<div class="inset-(--my-position) ...">  <!-- ... --></div>
```

This is just a shorthand for `inset-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix `inset`,`inset-x`,`inset-y`,`inset-s`,`inset-e`,`inset-bs`,`inset-be`,`top`,`left`,`bottom`, and `right` utilities with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="top-4 md:top-6 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `inset-<number>`,`inset-x-<number>`,`inset-y-<number>`,`inset-s-<number>`,`inset-e-<number>`,`inset-bs-<number>`,`inset-be-<number>`,`top-<number>`,`left-<number>`,`bottom-<number>`, and `right-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
