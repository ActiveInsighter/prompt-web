---
title: scrollbar-color
description: Utilities for controlling the color of an element's scrollbar.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 100
metadata:
  source: https://tailwindcss.com/docs/scrollbar-color
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# scrollbar-color

Utilities for controlling the color of an element's scrollbar.

| Class | Styles |
| --- | --- |
| `scrollbar-thumb-inherit` | `--tw-scrollbar-thumb: inherit; scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-current` | `--tw-scrollbar-thumb: currentColor; scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-transparent` | `--tw-scrollbar-thumb: transparent; scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-black` | `--tw-scrollbar-thumb: var(--color-black); /* #000 */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-white` | `--tw-scrollbar-thumb: var(--color-white); /* #fff */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-red-50` | `--tw-scrollbar-thumb: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-red-100` | `--tw-scrollbar-thumb: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-red-200` | `--tw-scrollbar-thumb: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-red-300` | `--tw-scrollbar-thumb: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |
| `scrollbar-thumb-red-400` | `--tw-scrollbar-thumb: var(--color-red-400); /* oklch(70.4% 0.191 22.216) */ scrollbar-color: var(--tw-scrollbar-thumb) var(--tw-scrollbar-track);` |

## [Examples](#examples)

### [Setting the scrollbar color](#setting-the-scrollbar-color)

Use utilities like `scrollbar-thumb-sky-700` and `scrollbar-track-sky-100` to control the colors of a scrollbar:

Scroll vertically

```
<div class="scrollbar-thumb-sky-700 scrollbar-track-sky-100 overflow-auto ...">  <!-- ... --></div>
```

You can set the thumb and track colors independently. If you set one without the other, the unset color defaults to transparent.

### [Changing the opacity](#changing-the-opacity)

Use the color opacity modifier to control the opacity of an element's scrollbar colors:

Scroll vertically

```
<div class="scrollbar-thumb-slate-900/60 scrollbar-track-slate-900/10 ...">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use utilities like `scrollbar-thumb-[<value>]` and `scrollbar-track-[<value>]` to set scrollbar colors based on
completely custom values:

```
<div class="scrollbar-thumb-[#0f766e] scrollbar-track-[#ccfbf1] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `scrollbar-thumb-(<custom-property>)` and
`scrollbar-track-(<custom-property>)` syntax:

```
<div class="scrollbar-thumb-(--my-scrollbar-thumb) scrollbar-track-(--my-scrollbar-track) ...">  <!-- ... --></div>
```

### [Applying on hover](#applying-on-hover)

Prefix a `scrollbar-color` utility with a variant like `hover:*` to only apply the utility in that state:

```
<div class="scrollbar-thumb-sky-700 hover:scrollbar-thumb-sky-500 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Responsive design](#responsive-design)

Prefix a `scrollbar-color` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="scrollbar-thumb-slate-900 scrollbar-track-slate-200 md:scrollbar-thumb-sky-700 ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now utilities like `scrollbar-thumb-regal-blue` and `scrollbar-track-regal-blue` can be used in your markup:

```
<div class="scrollbar-thumb-regal-blue">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
