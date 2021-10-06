---
recipe: api-interface
title: 'CanvasRenderingContext2D.fontVariantCaps'
mdn_url: /en-US/docs/Web/API/CanvasRenderingContext2D/fontVariantCaps
specifications: https://html.spec.whatwg.org/#dom-context-2d-fontvariantcaps
browser_compatibility: api.CanvasRenderingContext2D.fontVariantCaps
---

**When this feature ships, the content below will live on MDN under
[developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/fontVariantCaps](https://developer.mozilla.org/en-US/docs/Web/CanvasRenderingContext2D/fontVariantCaps).**

## Description

The `fontVariantCaps` property of `CanvasRenderingContext2D` allows developers
to control the use of alternate glyphs for capital letters. If multiple sizes 
of capital letter glyphs are available for the chosen font, this 
property will choose the one with appropriate size. Otherwise it synthesizes
small-caps by adapting uppercase glyphs. The default value is `normal`.


## Syntax

`CanvasRenderingContext2D.fontVariantCaps = "fontVariantCaps";`
`var fontVariantCaps = CanvasRenderingContext2D.fontVariantCaps;`

### Values

A `string` representing current the `fontVariantCaps` value. The possible values are:

`"normal"`
Deactivates of the use of alternate glyphs.

`"small-caps"`
Enables display of small capitals (OpenType feature: `smcp`). "Small-caps"
glyphs typically use the form of uppercase letters but are reduced to the
size of lowercase letters.

`"all-small-caps"`
Enables display of small capitals for both upper and lowercase letters 
(OpenType features: `c2sc`, `smcp`).

`"petite-caps"`
Enables display of petite capitals (OpenType feature: `pcap`). Petite-caps glyphs
typically use the form of uppercase letters but are reduced to the size of
lowercase letters.


`"all-petite-caps"`
Enables display of petite capitals for both upper and lowercase letters 
(OpenType features: `c2pc`, `pcap`).

`"unicase"`
Enables display of mixture of small capitals for uppercase letters with normal 
lowercase letters (OpenType feature: `unic`).

`"titling-caps"`
Enables display of titling capitals (OpenType feature: `titl`). Uppercase 
letter glyphs are often designed for use with lowercase letters. When used in 
all uppercase titling sequences they can appear too strong. Titling capitals 
are designed specifically for this situation.


### Example

This example demonstrates the various `fontVariantCaps` property values:

```js
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
ctx.font = '20px serif';

ctx.fontVariantCaps = "normal";
ctx.fillText('Normal Caps', 20, 50);

ctx.fontVariantCaps = "small-caps";
ctx.fillText('Small-Caps', 20, 100);

ctx.fontVariantCaps = "all-small-caps";
ctx.fillText('All-Small-Caps', 20, 150);

ctx.fontVariantCaps = "petite-caps";
ctx.fillText('Peetite-Caps', 20, 200);

ctx.fontVariantCaps = "all-petite-caps";
ctx.fillText('All-Petite-Caps', 20, 250);

ctx.fontVariantCaps = "unicase";
ctx.fillText('Unicase Case', 20, 300);

ctx.fontVariantCaps = "titling-caps";
ctx.fillText('Titling-Caps', 20, 350);
```

## See also
[CSS property font-variant-caps](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-caps)
