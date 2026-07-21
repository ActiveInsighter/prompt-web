---
title: pointer-events
description: Utilities for controlling whether an element responds to pointer events.
language: en-US
role: reference
tags:
- tailwindcss
- interactivity
sort: 70
metadata:
  source: https://tailwindcss.com/docs/pointer-events
  sidebar_group: Interactivity
  section: Interactivity
  collector: rendered-html
---

# pointer-events

Utilities for controlling whether an element responds to pointer events.

| Class | Styles |
| --- | --- |
| `pointer-events-auto` | `pointer-events: auto;` |
| `pointer-events-none` | `pointer-events: none;` |

## [Examples](#examples)

### [Ignoring pointer events](#ignoring-pointer-events)

Use the `pointer-events-none` utility to make an element ignore pointer events, like `:hover` and `click` events:

Click the search icons to see the expected behavior

```
<div class="relative ...">  <div class="pointer-events-auto absolute ...">    <svg class="absolute h-5 w-5 text-gray-400">      <!-- ... -->    </svg>  </div>  <input type="text" placeholder="Search" class="..." /></div><div class="relative ...">  <div class="pointer-events-none absolute ...">    <svg class="absolute h-5 w-5 text-gray-400">      <!-- ... -->    </svg>  </div>  <input type="text" placeholder="Search" class="..." /></div>
```

The pointer events will still trigger on child elements and pass-through to elements that are "beneath" the target.

### [Restoring pointer events](#restoring-pointer-events)

Use the `pointer-events-auto` utility to revert to the default browser behavior for pointer events:

```
<div class="pointer-events-none md:pointer-events-auto ...">  <!-- ... --></div>
```
