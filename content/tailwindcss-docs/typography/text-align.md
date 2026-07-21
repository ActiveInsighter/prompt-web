---
title: text-align
description: Utilities for controlling the alignment of text.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 150
metadata:
  source: https://tailwindcss.com/docs/text-align
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# text-align

Utilities for controlling the alignment of text.

| Class | Styles |
| --- | --- |
| `text-left` | `text-align: left;` |
| `text-center` | `text-align: center;` |
| `text-right` | `text-align: right;` |
| `text-justify` | `text-align: justify;` |
| `text-start` | `text-align: start;` |
| `text-end` | `text-align: end;` |

## [Examples](#examples)

### [Left aligning text](#left-aligning-text)

Use the `text-left` utility to left align the text of an element:

```
<p class="text-left">So I started to walk into the water...</p>
```

### [Right aligning text](#right-aligning-text)

Use the `text-right` utility to right align the text of an element:

```
<p class="text-right">So I started to walk into the water...</p>
```

### [Centering text](#centering-text)

Use the `text-center` utility to center the text of an element:

```
<p class="text-center">So I started to walk into the water...</p>
```

### [Justifying text](#justifying-text)

Use the `text-justify` utility to justify the text of an element:

```
<p class="text-justify">So I started to walk into the water...</p>
```

### [Using logical properties](#using-logical-properties)

Use the `text-start` and `text-end` utilities, which use [logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties/Basic_concepts) to map to either the left or right side based on the text direction:

```
<div dir="rtl" lang="ar">  <p class="text-end">فبدأت بالسير نحو الماء...</p></div>
```

### [Responsive design](#responsive-design)

Prefix a `text-align` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="text-left md:text-center ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
