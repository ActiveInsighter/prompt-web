---
title: scroll-margin
description: Utilities for controlling the scroll offset around items in a snap container.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 130
metadata:
  source: https://tailwindcss.com/docs/scroll-margin
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scroll-margin

Utilities for controlling the scroll offset around items in a snap container.

| Class | Styles |
| --- | --- |
| `scroll-m-<number>` | `scroll-margin: calc(var(--spacing) * <number>);` |
| `-scroll-m-<number>` | `scroll-margin: calc(var(--spacing) * -<number>);` |
| `scroll-m-(<custom-property>)` | `scroll-margin: var(<custom-property>);` |
| `scroll-m-[<value>]` | `scroll-margin: <value>;` |
| `scroll-mx-<number>` | `scroll-margin-inline: calc(var(--spacing) * <number>);` |
| `-scroll-mx-<number>` | `scroll-margin-inline: calc(var(--spacing) * -<number>);` |
| `scroll-mx-(<custom-property>)` | `scroll-margin-inline: var(<custom-property>);` |
| `scroll-mx-[<value>]` | `scroll-margin-inline: <value>;` |
| `scroll-my-<number>` | `scroll-margin-block: calc(var(--spacing) * <number>);` |
| `-scroll-my-<number>` | `scroll-margin-block: calc(var(--spacing) * -<number>);` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use the `scroll-mt-<number>`, `scroll-mr-<number>`, `scroll-mb-<number>`, and `scroll-ml-<number>` utilities like `scroll-ml-4` and `scroll-mt-6` to set the scroll offset around items within a snap container:

Scroll in the grid of images to see the expected behavior

```
<div class="snap-x ...">  <div class="snap-start scroll-ml-6 ...">    <img src="/img/vacation-01.jpg"/>  </div>  <div class="snap-start scroll-ml-6 ...">    <img src="/img/vacation-02.jpg"/>  </div>  <div class="snap-start scroll-ml-6 ...">    <img src="/img/vacation-03.jpg"/>  </div>  <div class="snap-start scroll-ml-6 ...">    <img src="/img/vacation-04.jpg"/>  </div>  <div class="snap-start scroll-ml-6 ...">    <img src="/img/vacation-05.jpg"/>  </div></div>
```

### [Using negative values](#using-negative-values)

To use a negative scroll margin value, prefix the class name with a dash to convert it to a negative value:

```
<div class="snap-start -scroll-ml-6 ...">  <!-- ... --></div>
```

### [Using logical properties](#using-logical-properties)

Use the `scroll-ms-<number>` and `scroll-me-<number>` utilities to set the `scroll-margin-inline-start` and `scroll-margin-inline-end` [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties/Basic_concepts), which map to either the left or right side based on the text direction:

Scroll in the grid of images to see the expected behavior

```
<div dir="ltr">  <div class="snap-x ...">    <div class="snap-start scroll-ms-6 ...">      <img src="/img/vacation-01.jpg"/>    </div>    <!-- ... -->  </div></div><div dir="rtl">  <div class="snap-x ...">    <div class="snap-start scroll-ms-6 ...">      <img src="/img/vacation-01.jpg"/>    </div>    <!-- ... -->  </div></div>
```

For more control, you can also use the [LTR and RTL modifiers](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support) to conditionally apply specific styles depending on the current text direction.

Use the `scroll-mbs-<number>` and `scroll-mbe-<number>` utilities to set the `scroll-margin-block-start` and `scroll-margin-block-end` logical properties, which map to either the top or bottom side based on the writing mode:

```
<div class="snap-y ...">  <div class="snap-start scroll-mbs-6 ...">    <!-- ... -->  </div></div>
```

### [Using a custom value](#using-a-custom-value)

Use utilities like `scroll-ml-[<value>]` and `scroll-me-[<value>]` to set the scroll margin based on a completely custom value:

```
<div class="scroll-ml-[24rem] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `scroll-ml-(<custom-property>)` syntax:

```
<div class="scroll-ml-(--my-scroll-margin) ...">  <!-- ... --></div>
```

This is just a shorthand for `scroll-ml-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `scroll-margin` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="scroll-m-8 md:scroll-m-0 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

The `scroll-m-<number>`,`scroll-mx-<number>`,`scroll-my-<number>`,`scroll-ms-<number>`,`scroll-me-<number>`,`scroll-mbs-<number>`,`scroll-mbe-<number>`,`scroll-mt-<number>`,`scroll-mr-<number>`,`scroll-mb-<number>`, and `scroll-ml-<number>` utilities are driven by the `--spacing` theme variable, which can be customized in your own theme:

```
@theme {  --spacing: 1px; }
```

Learn more about customizing the spacing scale in the [theme variable documentation](https://tailwindcss.com/docs/theme).
