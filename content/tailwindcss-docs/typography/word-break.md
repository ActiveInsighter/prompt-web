---
title: word-break
description: Utilities for controlling word breaks in an element.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 290
metadata:
  source: https://tailwindcss.com/docs/word-break
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# word-break

Utilities for controlling word breaks in an element.

| Class | Styles |
| --- | --- |
| `break-normal` | `word-break: normal;` |
| `break-all` | `word-break: break-all;` |
| `break-keep` | `word-break: keep-all;` |

## [Examples](#examples)

### [Normal](#normal)

Use the `break-normal` utility to only add line breaks at normal word break points:

```
<p class="break-normal">The longest word in any of the major...</p>
```

### [Break All](#break-all)

Use the `break-all` utility to add line breaks whenever necessary, without trying to preserve whole words:

```
<p class="break-all">The longest word in any of the major...</p>
```

### [Break Keep](#break-keep)

Use the `break-keep` utility to prevent line breaks from being applied to Chinese/Japanese/Korean (CJK) text:

```
<p class="break-keep">抗衡不屈不挠...</p>
```

For non-CJK text the `break-keep` utility has the same behavior as the `break-normal` utility.

### [Responsive design](#responsive-design)

Prefix a `word-break` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="break-normal md:break-all ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
