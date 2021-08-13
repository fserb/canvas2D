---
recipe: api-interface
title: 'CanvasRenderingContext2D.textRendering'
mdn_url: /en-US/docs/Web/API/CanvasRenderingContext2D/textRendering
specifications: https://html.spec.whatwg.org/#dom-context-2d-textrendering
browser_compatibility: api.CanvasRenderingContext2D.textRendering
---

**When this feature ships, the content below will live on MDN under
[developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/textRendering](https://developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/textRendering).**

## Description

The `textRendering` property of `CanvasRenderingContext2D` provides information
to the rendering engine about what to optimize for when rendering text.

## Syntax

`CanvasRenderingContext2D.textRendering = "textRendering";`
`var textRendering = CanvasRenderingContext2D.textRendering;`

### Value
A `string` representing the current `textRendering` value. The possible values are:

`"auto"`
The browser makes educated guesses about when to optimize for speed, legibility, 
and geometric precision while drawing text. This is the default value.

`"optimizeSpeed"`
The browser emphasizes rendering speed over legibility and geometric precision 
when drawing text. It disables kerning and ligatures.

`"optimizeLegibility"`
The browser emphasizes legibility over rendering speed and geometric precision.
This enables kerning and optional ligatures.

`"geometricPrecision"`
The browser emphasizes geometric precision over rendering speed and legibility. 
Certain aspects of fonts, don't scale linearly (e.g. kerning). Geometric Precision
can make text using those fonts look good. This value also allows developers to
scale text fluidly and it accepts float values for font size.

### Example

Example demonstrates the various `textRendering` property values:

#### optimizespeed vs optimizelegibility
```js
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

ctx.font = '20px serif';
ctx.textRendering = "optimizespeed";
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 50);

ctx.textRendering = "optimizelegibility";
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 100);
```

#### optimizespeed vs geometricPrecision
```js
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

ctx.font = '20px serif';
ctx.textRendering = "optimizespeed";
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 50);

ctx.textRendering = "geometricPrecision";
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 100);
```

#### geometricPrecision
```js
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

ctx.font = '30px serif';
ctx.textRendering = "geometricPrecision";
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 50);
ctx.font = '29.5px serif';
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 100);
ctx.font = '29px serif';
ctx.fillText('LYoWAT - ff fi fl ffl', 20, 150);
```

## See also
[CSS property text-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/text-rendering)
