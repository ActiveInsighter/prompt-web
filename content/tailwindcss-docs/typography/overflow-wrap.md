---
title: overflow-wrap
description: Utilities for controlling line breaks within words in an overflowing
  element.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 300
metadata:
  source: https://tailwindcss.com/docs/overflow-wrap
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# overflow-wrap

Utilities for controlling line breaks within words in an overflowing element.

| Class | Styles |
| --- | --- |
| `wrap-break-word` | `overflow-wrap: break-word;` |
| `wrap-anywhere` | `overflow-wrap: anywhere;` |
| `wrap-normal` | `overflow-wrap: normal;` |

## [Examples](#examples)

### [Wrapping mid-word](#wrapping-mid-word)

Use the `wrap-break-word` utility to allow line breaks between letters in a word if needed:

```
<p class="wrap-break-word">The longest word in any of the major...</p>
```

### [Wrapping anywhere](#wrapping-anywhere)

The `wrap-anywhere` utility behaves similarly to `wrap-break-word`, except that the browser factors in mid-word line breaks when calculating the intrinsic size of the element:

```
<div class="flex max-w-sm">  <img class="size-16 rounded-full" src="/img/profile.jpg" />  <div class="wrap-break-word">    <p class="font-medium">Jay Riemenschneider</p>    <p>jason.riemenschneider@vandelayindustries.com</p>  </div></div><div class="flex max-w-sm">  <img class="size-16 rounded-full" src="/img/profile.jpg" />  <div class="wrap-anywhere">    <p class="font-medium">Jay Riemenschneider</p>    <p>jason.riemenschneider@vandelayindustries.com</p>  </div></div>
```

This is useful for wrapping text inside of `flex` containers, where you would usually need to set `min-width: 0` on the child element to allow it to shrink below its content size.

### [Wrapping normally](#wrapping-normally)

Use the `wrap-normal` utility to only allow line breaks at natural wrapping points, like spaces, hyphens, and punctuation:

```
<p class="wrap-normal">The longest word in any of the major...</p>
```

### [Responsive design](#responsive-design)

Prefix an `overflow-wrap` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="wrap-normal md:wrap-break-word ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
