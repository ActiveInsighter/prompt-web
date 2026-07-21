---
title: accent-color
description: Utilities for controlling the accented color of a form control.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 10
metadata:
  source: https://tailwindcss.com/docs/accent-color
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# accent-color

Utilities for controlling the accented color of a form control.

| Class | Styles |
| --- | --- |
| `accent-inherit` | `accent-color: inherit;` |
| `accent-current` | `accent-color: currentColor;` |
| `accent-transparent` | `accent-color: transparent;` |
| `accent-black` | `accent-color: var(--color-black); /* #000 */` |
| `accent-white` | `accent-color: var(--color-white); /* #fff */` |
| `accent-red-50` | `accent-color: var(--color-red-50); /* oklch(97.1% 0.013 17.38) */` |
| `accent-red-100` | `accent-color: var(--color-red-100); /* oklch(93.6% 0.032 17.717) */` |
| `accent-red-200` | `accent-color: var(--color-red-200); /* oklch(88.5% 0.062 18.334) */` |
| `accent-red-300` | `accent-color: var(--color-red-300); /* oklch(80.8% 0.114 19.571) */` |
| `accent-red-400` | `accent-color: var(--color-red-400); /* oklch(70.4% 0.191 22.216) */` |

## [Examples](#examples)

### [Setting the accent color](#setting-the-accent-color)

Use utilities like `accent-rose-500` and `accent-lime-600` to change the accent color of an element:

```
<label>  <input type="checkbox" checked />  Browser default</label><label>  <input class="accent-pink-500" type="checkbox" checked />  Customized</label>
```

This is helpful for styling elements like checkboxes and radio groups by overriding the browser's default color.

### [Changing the opacity](#changing-the-opacity)

Use the color opacity modifier to control the opacity of an element's accent color:

```
<input class="accent-purple-500/25" type="checkbox" checked /><input class="accent-purple-500/75" type="checkbox" checked />
```

Setting the accent color opacity has limited browser-support and only works in Firefox at this time.

### [Using a custom value](#using-a-custom-value)

Use the `accent-[<value>]` syntax to set the accent color based on a completely custom value:

```
<input class="accent-[#50d71e] ..." type="checkbox" />
```

For CSS variables, you can also use the `accent-(<custom-property>)` syntax:

```
<input class="accent-(--my-accent-color) ..." type="checkbox" />
```

This is just a shorthand for `accent-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Applying on hover](#applying-on-hover)

Prefix an `accent-color` utility with a variant like `hover:*` to only apply the utility in that state:

```
<input class="accent-black hover:accent-pink-500" type="checkbox" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

### [Responsive design](#responsive-design)

Prefix an `accent-color` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<input class="accent-black md:accent-pink-500 ..." type="checkbox" />
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now the `accent-regal-blue` utility can be used in your markup:

```
<input class="accent-regal-blue" type="checkbox" />
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
