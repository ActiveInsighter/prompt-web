---
title: hyphens
description: Utilities for controlling how words should be hyphenated.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 310
metadata:
  source: https://tailwindcss.com/docs/hyphens
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# hyphens

Utilities for controlling how words should be hyphenated.

| Class | Styles |
| --- | --- |
| `hyphens-none` | `hyphens: none;` |
| `hyphens-manual` | `hyphens: manual;` |
| `hyphens-auto` | `hyphens: auto;` |

## [Examples](#examples)

### [Preventing hyphenation](#preventing-hyphenation)

Use the `hyphens-none` utility to prevent words from being hyphenated even if the line break suggestion `&shy;` is used:

```
<p class="hyphens-none">  ... Kraftfahrzeug&shy;haftpflichtversicherung is a ...</p>
```

### [Manual hyphenation](#manual-hyphenation)

Use the `hyphens-manual` utility to only set hyphenation points where the line break suggestion `&shy;` is used:

```
<p class="hyphens-manual">  ... Kraftfahrzeug&shy;haftpflichtversicherung is a ...</p>
```

This is the default browser behavior.

### [Automatic hyphenation](#automatic-hyphenation)

Use the `hyphens-auto` utility to allow the browser to automatically choose hyphenation points based on the language:

```
<p class="hyphens-auto" lang="de">  ... Kraftfahrzeughaftpflichtversicherung is a ...</p>
```

The line break suggestion `&shy;` will be preferred over automatic hyphenation points.

### [Responsive design](#responsive-design)

Prefix a `hyphens` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="hyphens-none md:hyphens-auto ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
