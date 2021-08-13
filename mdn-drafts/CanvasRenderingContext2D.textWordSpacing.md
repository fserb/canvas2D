---
recipe: api-interface
title: 'CanvasRenderingContext2D.textWordSpacing'
mdn_url: /en-US/docs/Web/API/CanvasRenderingContext2D/textWordSpacing
specifications: https://html.spec.whatwg.org/#dom-context-2d-textwordspacing
browser_compatibility: api.CanvasRenderingContext2D.textWordSpacing
---

**When this feature ships, the content below will live on MDN under
[developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/textWordSpacing](https://developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/textWordSpacing).**

## Description

The `textWordSpacing` property of the `CanvasRenderingContext2D` interface
returns a double that represents horizontal spacing between words.
Setting `textWordSpacing` to postive values spreads words further apart, 
while negative values brings them closer together. The default value 
is 0.

## Syntax

`var textWordSpacing = CanvasRenderingContext2D.textWordSpacing`
`CanvasRenderingContext2D.textWordSpacing = textWordSpacing`

### Value

A double representing horizontal spacing behavior between words.

### Example

This example demonstrates the various `textWordSpacing` property values:

```js
const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
const wordSpacings = [-7, 0, 10];
ctx.font = '20px serif';

wordSpacings.forEach(function (wordSpacing, index) {
  ctx.textWordSpacing = wordSpacing;
  const y = 50 + index * 50;
  ctx.fillText('Hello World (textWordSpacing: ' + wordSpacing + ')', 20, y);
});
```

## See also
[CSS property word-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/word-spacing)
