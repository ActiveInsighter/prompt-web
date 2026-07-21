---
title: font-variant-numeric
description: Utilities for controlling the variant of numbers.
language: en-US
role: reference
tags:
- tailwindcss
- typography
sort: 70
metadata:
  source: https://tailwindcss.com/docs/font-variant-numeric
  sidebar_group: Typography
  section: Typography
  collector: rendered-html
---

# font-variant-numeric

Utilities for controlling the variant of numbers.

| Class | Styles |
| --- | --- |
| `normal-nums` | `font-variant-numeric: normal;` |
| `ordinal` | `font-variant-numeric: ordinal;` |
| `slashed-zero` | `font-variant-numeric: slashed-zero;` |
| `lining-nums` | `font-variant-numeric: lining-nums;` |
| `oldstyle-nums` | `font-variant-numeric: oldstyle-nums;` |
| `proportional-nums` | `font-variant-numeric: proportional-nums;` |
| `tabular-nums` | `font-variant-numeric: tabular-nums;` |
| `diagonal-fractions` | `font-variant-numeric: diagonal-fractions;` |
| `stacked-fractions` | `font-variant-numeric: stacked-fractions;` |

## [Examples](#examples)

### [Using ordinal glyphs](#using-ordinal-glyphs)

Use the `ordinal` utility to enable special glyphs for the ordinal markers in fonts that support them:

```
<p class="ordinal ...">1st</p>
```

### [Using slashed zeroes](#using-slashed-zeroes)

Use the `slashed-zero` utility to force a zero with a slash in fonts that support them:

```
<p class="slashed-zero ...">0</p>
```

### [Using lining figures](#using-lining-figures)

Use the `lining-nums` utility to use numeric glyphs that are aligned by their baseline in fonts that support them:

```
<p class="lining-nums ...">1234567890</p>
```

### [Using oldstyle figures](#using-oldstyle-figures)

Use the `oldstyle-nums` utility to use numeric glyphs where some numbers have descenders in fonts that support them:

```
<p class="oldstyle-nums ...">1234567890</p>
```

### [Using proportional figures](#using-proportional-figures)

Use the `proportional-nums` utility to use numeric glyphs that have proportional widths in fonts that support them:

```
<p class="proportional-nums ...">12121</p><p class="proportional-nums ...">90909</p>
```

### [Using tabular figures](#using-tabular-figures)

Use the `tabular-nums` utility to use numeric glyphs that have uniform/tabular widths in fonts that support them:

```
<p class="tabular-nums ...">12121</p><p class="tabular-nums ...">90909</p>
```

### [Using diagonal fractions](#using-diagonal-fractions)

Use the `diagonal-fractions` utility to replace numbers separated by a slash with common diagonal fractions in fonts that support them:

```
<p class="diagonal-fractions ...">1/2 3/4 5/6</p>
```

### [Using stacked fractions](#using-stacked-fractions)

Use the `stacked-fractions` utility to replace numbers separated by a slash with common stacked fractions in fonts that support them:

```
<p class="stacked-fractions ...">1/2 3/4 5/6</p>
```

### [Stacking multiple utilities](#stacking-multiple-utilities)

The `font-variant-numeric` utilities are composable so you can enable multiple variants by combining them:

```
<dl class="...">  <dt class="...">Subtotal</dt>  <dd class="text-right slashed-zero tabular-nums ...">$100.00</dd>  <dt class="...">Tax</dt>  <dd class="text-right slashed-zero tabular-nums ...">$14.50</dd>  <dt class="...">Total</dt>  <dd class="text-right slashed-zero tabular-nums ...">$114.50</dd></dl>
```

### [Resetting numeric font variants](#resetting-numeric-font-variants)

Use the `normal-nums` property to reset numeric font variants:

```
<p class="slashed-zero tabular-nums md:normal-nums ...">  <!-- ... --></p>
```

### [Responsive design](#responsive-design)

Prefix a `font-variant-numeric` utility with a breakpoint variant like `md:` to only apply the utility at medium screen sizes and above:

```
<p class="proportional-nums md:tabular-nums ...">  Lorem ipsum dolor sit amet...</p>
```

Learn more about using variants in the [variants documentation](https://tailwindcss.com/docs/hover-focus-and-other-states).
