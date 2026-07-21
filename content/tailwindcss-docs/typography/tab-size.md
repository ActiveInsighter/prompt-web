---
title: tab-size
description: Utilities for controlling the size of tab characters.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 260
metadata:
  source: https://tailwindcss.com/docs/tab-size
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# tab-size

Utilities for controlling the size of tab characters.

| Class | Styles |
| --- | --- |
| `tab-<number>` | `tab-size: <number>;` |
| `tab-(<custom-property>)` | `tab-size: var(<custom-property>);` |
| `tab-[<value>]` | `tab-size: <value>;` |

## [Examples](#examples)

### [Basic example](#basic-example)

Use `tab-<number>` utilities like `tab-2` and `tab-8` to control the size of tab characters:

```
function indent() {	return 'tabbed';}
```

```
function indent() {	return 'tabbed';}
```

```
<pre class="tab-2 ...">function indent() {&#10;&#9;return 'tabbed'&#10;}</pre><pre class="tab-8 ...">function indent() {&#10;&#9;return 'tabbed'&#10;}</pre>
```

### [Using a custom value](#using-a-custom-value)

Use the `tab-[<value>]` syntax to set the tab size based on a completely custom value:

```
<pre class="tab-[12px] ...">  <!-- ... --></pre>
```

For CSS variables, you can also use the `tab-(<custom-property>)` syntax:

```
<pre class="tab-(--my-tab-size) ...">  <!-- ... --></pre>
```

This is just a shorthand for `tab-[var(<custom-property>)]` that adds the `var()` function for you automatically.

### [Responsive design](#responsive-design)

Prefix a `tab-size` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<pre class="tab-4 md:tab-8 ...">  <!-- ... --></pre>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
