---
title: border-collapse
description: Utilities for controlling whether table borders should collapse or be
  separated.
language: en-US
role: reference
tags:
- tailwindcss
- tables
sort: 10
metadata:
  source: https://tailwindcss.com/docs/border-collapse
  sidebar_group: Tables
  section: Tables
  collector: rendered-html
---

# border-collapse

Utilities for controlling whether table borders should collapse or be separated.

| Class | Styles |
| --- | --- |
| `border-collapse` | `border-collapse: collapse;` |
| `border-separate` | `border-collapse: separate;` |

## [Examples](#examples)

### [Collapsing table borders](#collapsing-table-borders)

Use the `border-collapse` utility to combine adjacent cell borders into a single border when possible:

```
<table class="border-collapse border border-gray-400 ...">  <thead>    <tr>      <th class="border border-gray-300 ...">State</th>      <th class="border border-gray-300 ...">City</th>    </tr>  </thead>  <tbody>    <tr>      <td class="border border-gray-300 ...">Indiana</td>      <td class="border border-gray-300 ...">Indianapolis</td>    </tr>    <tr>      <td class="border border-gray-300 ...">Ohio</td>      <td class="border border-gray-300 ...">Columbus</td>    </tr>    <tr>      <td class="border border-gray-300 ...">Michigan</td>      <td class="border border-gray-300 ...">Detroit</td>    </tr>  </tbody></table>
```

Note that this includes collapsing borders on the top-level `<table>` tag.

### [Separating table borders](#separating-table-borders)

Use the `border-separate` utility to force each cell to display its own separate borders:

```
<table class="border-separate border border-gray-400 ...">  <thead>    <tr>      <th class="border border-gray-300 ...">State</th>      <th class="border border-gray-300 ...">City</th>    </tr>  </thead>  <tbody>    <tr>      <td class="border border-gray-300 ...">Indiana</td>      <td class="border border-gray-300 ...">Indianapolis</td>    </tr>    <tr>      <td class="border border-gray-300 ...">Ohio</td>      <td class="border border-gray-300 ...">Columbus</td>    </tr>    <tr>      <td class="border border-gray-300 ...">Michigan</td>      <td class="border border-gray-300 ...">Detroit</td>    </tr>  </tbody></table>
```

### [Responsive design](#responsive-design)

Prefix a `border-collapse` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<table class="border-collapse md:border-separate ...">  <!-- ... --></table>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
