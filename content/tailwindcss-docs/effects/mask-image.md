---
title: mask-image
description: Utilities for controlling an element's mask image.
language: en-US
role: reference
tags:
- tailwindcss
- effects
sort: 80
metadata:
  source: https://tailwindcss.com/docs/mask-image
  sidebar_group: Effects
  section: Effects
  collector: rendered-html
---

# mask-image

Utilities for controlling an element's mask image.

| Class | Styles |
| --- | --- |
| `mask-[<value>]` | `mask-image: <value>;` |
| `mask-(<custom-property>)` | `mask-image: var(<custom-property>);` |
| `mask-none` | `mask-image: none;` |
| `mask-linear-<number>` | `mask-image: linear-gradient(<number>deg, black var(--tw-mask-linear-from)), transparent var(--tw-mask-linear-to));` |
| `-mask-linear-<number>` | `mask-image: linear-gradient(calc(<number>deg * -1), black var(--tw-mask-linear-from)), transparent var(--tw-mask-linear-to));` |
| `mask-linear-from-<number>` | `mask-image: linear-gradient(var(--tw-mask-linear-position), black calc(var(--spacing) * <number>), transparent var(--tw-mask-linear-to));` |
| `mask-linear-from-<percentage>` | `mask-image: linear-gradient(var(--tw-mask-linear-position), black <percentage>, transparent var(--tw-mask-linear-to));` |
| `mask-linear-from-<color>` | `mask-image: linear-gradient(var(--tw-mask-linear-position), <color> var(--tw-mask-linear-from), transparent var(--tw-mask-linear-to));` |
| `mask-linear-from-(<custom-property>)` | `mask-image: linear-gradient(var(--tw-mask-linear-position), black <custom-property>, transparent var(--tw-mask-linear-to));` |
| `mask-linear-from-[<value>]` | `mask-image: linear-gradient(var(--tw-mask-linear-position), black <value>, transparent var(--tw-mask-linear-to));` |

## [Examples](#examples)

### [Using an image mask](#using-an-image-mask)

Use the `mask-[<value>]` syntax to set the mask image of an element:

```
<div class="mask-[url(/img/scribble.png)] bg-[url(/img/mountains.jpg)] ...">  <!-- ... --></div>
```

### [Masking edges](#masking-edges)

Use utilities like `mask-b-from-<value>` and `mask-t-to-<value>` to add a linear gradient mask to a single side of an element:

```
<div class="mask-t-from-50% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-r-from-30% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-l-from-50% mask-l-to-90% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-b-from-20% mask-b-to-80% bg-[url(/img/mountains.jpg)] ..."></div>
```

Additionally, use utilities like `mask-x-from-70%` and `mask-y-to-90%` to apply a mask to two sides of an element at the same time:

```
<div class="mask-x-from-70% mask-x-to-90% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-y-from-70% mask-y-to-90% bg-[url(/img/mountains.jpg)] ..."></div>
```

By default, linear gradient masks transition from black to transparent, but you can customize the gradient colors using the `mask-<side>-from-<color>` and `mask-<side>-to-<color>` utilities.

### [Adding an angled linear mask](#adding-an-angled-linear-mask)

Use utilities like `mask-linear-<angle>`, `mask-linear-from-20`, and `mask-linear-to-40` to add a custom linear gradient mask to an element:

```
<div class="mask-linear-50 mask-linear-from-60% mask-linear-to-80% bg-[url(/img/mountains.jpg)] ..."></div><div class="-mask-linear-50 mask-linear-from-60% mask-linear-to-80% bg-[url(/img/mountains.jpg)] ..."></div>
```

### [Adding a radial mask](#adding-a-radial-mask)

Use the `mask-radial-from-<value>` and `mask-radial-to-<value>` utilities to add a radial gradient mask to an element:

```
<div class="flex items-center gap-4">  <img class="mask-radial-[100%_100%] mask-radial-from-75% mask-radial-at-left ..." src="/img/keyboard.png" />  <div class="font-medium">    <p class="font-mono text-xs text-blue-500 uppercase dark:text-blue-400">Speed</p>    <p class="mt-2 text-base text-gray-700 dark:text-gray-300">Built for power users</p>    <p class="mt-1 text-sm leading-relaxed text-balance text-gray-500">      Work faster than ever with customizable keyboard shortcuts    </p>  </div></div>
```

By default, radial gradient masks transition from black to transparent, but you can customize the gradient colors using the `mask-radial-from-<color>` and `mask-radial-to-<color>` utilities.

#### [Setting the radial position](#setting-the-radial-position)

Use utilities like `mask-radial-at-bottom-left` and `mask-radial-at-[35%_35%]` to set the position of the center of the radial gradient mask:

```
<div class="mask-radial-at-top-left mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-top mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-top-right mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-left mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-center mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-right mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-bottom-left mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-bottom mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-at-bottom-right mask-radial-from-100% bg-[url(/img/mountains.jpg)] ..."></div>
```

This is different from [`mask-position`](https://tailwindcss.com/docs/mask-position) which sets the position of the mask image itself, not the radial gradient.

#### [Setting the radial size](#setting-the-radial-size)

Use utilities like `mask-radial-closest-corner` and `mask-radial-farthest-side` to set the size of the radial gradient mask:

```
<div class="mask-radial-closest-side mask-radial-from-100% mask-radial-at-[30%_30%] bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-closest-corner mask-radial-from-100% mask-radial-at-[30%_30%] bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-farthest-side mask-radial-from-100% mask-radial-at-[30%_30%] bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-radial-farthest-corner mask-radial-from-100% mask-radial-at-[30%_30%] bg-[url(/img/mountains.jpg)] ..."></div>
```

When setting a custom radial gradient size, the units you can use depend on the `<ending-shape>` of the gradient which is set to `ellipse` by default.

With `mask-circle`, you can only use a single fixed length, like `mask-radial-[5rem]`. Whereas with `mask-ellipse`, you can specify each axis as a fixed length or percentage, like `mask-radial-[40%_80%]`.

### [Adding a conic mask](#adding-a-conic-mask)

Use the `mask-conic-from-<value>`, `mask-conic-to-<value>` and `mask-conic-<angle>` utilities to add a conic gradient mask to an element:

```
<div class="flex items-center gap-5 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5 dark:bg-gray-800">  <div class="grid grid-cols-1 grid-rows-1">    <div class="border-4 border-gray-100 dark:border-gray-700 ..."></div>    <div class="border-4 border-amber-500 mask-conic-from-75% mask-conic-to-75% dark:border-amber-400 ..."></div>  </div>  <div class="w-0 flex-1 text-sm text-gray-950 dark:text-white">    <p class="font-medium">Storage used: 75%</p>    <p class="mt-1 text-gray-500 dark:text-gray-400"><span class="font-medium">0.48 GB</span> out of 2 GB remaining</p>  </div></div>
```

By default, conic gradient masks transition from black to transparent, but you can customize the gradient colors using the `mask-conic-from-<color>` and `mask-conic-to-<color>` utilities.

### [Combining masks](#combining-masks)

Gradient mask utilities, like `mask-radial-from-<value>`, `mask-conic-to-<value>`, and `mask-l-from-<value>` can be combined to create more complex gradient masks:

```
<div class="mask-b-from-50% mask-radial-[50%_90%] mask-radial-from-80% bg-[url(/img/mountains.jpg)] ..."></div><div class="mask-r-from-80% mask-b-from-80% mask-radial-from-70% mask-radial-to-85% bg-[url(/img/mountains.jpg)] ..."></div>
```

This behavior relies on the fact that Tailwind sets the [`mask-composite` property](https://tailwindcss.com/docs/mask-composite) to `intersect` by default. Changing this property will affect how the gradient masks are combined.

### [Removing mask images](#removing-mask-images)

Use the `mask-none` utility to remove an existing mask image from an element:

```
<div class="mask-none">  <!-- ... --></div>
```

### [Using a custom value](#using-a-custom-value)

Use utilities like `mask-linear-[<value>]` and `mask-radial-[<value>]` to set the mask image based on a completely custom value:

```
<div class="mask-linear-[70deg,transparent_10%,black,transparent_80%] ...">  <!-- ... --></div>
```

For CSS variables, you can also use the `mask-linear-(<custom-property>)` syntax:

```
<div class="mask-linear-(--my-mask) ...">  <!-- ... --></div>
```

This is just a shorthand for `mask-linear-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `mask-image` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<div class="mask-radial-from-70% md:mask-radial-from-50% ...">  <!-- ... --></div>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).

## [Customizing your theme](#customizing-your-theme)

Use the `--color-*` theme variables to customize the color utilities in your project:

```
@theme {  --color-regal-blue: #243c5a; }
```

Now utilities like `mask-radial-from-regal-blue`,`mask-conic-to-regal-blue`, and `mask-b-from-regal-blue` can be used in your markup:

```
<div class="mask-radial-from-regal-blue">  <!-- ... --></div>
```

Learn more about customizing your theme in the [theme documentation](https://tailwindcss.com/docs/theme#customizing-your-theme).
