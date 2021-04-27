CSSColorValue color input
=================
**Status**: explainer.

Allow color input on canvas to use a CSSColorValue object.

Rationale
---------

The current way to set colors forces developers to build strings, that then are parsed into values.
This is a quality of life change.


Proposal
--------

```webidl
interface mixin CanvasFillStrokeStyles {
  attribute (DOMString or CSSColorValue or
    CanvasGradient or CanvasPattern) strokeStyle;
  attribute (DOMString or CSSColorValue or
    CanvasGradient or CanvasPattern) fillStyle;
};

interface mixin CanvasShadowStyles {
  attribute (DOMString or CSSColorValue) shadowColor;
};

interface CanvasGradient {
  void addColorStop(double offset, DOMString color);
  void addColorStop(double offset, CSSColorValue);
}
```

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = new CSSRGB(1, 0, 1, 0.5); // half-transparent magenta
ctx.strokeStyle = new CSSHSL(CSS.deg(0), 0.5, 1); // bright red
```

Alternatives considered
-----------------------

### Include color format

Array color input `ctx.fillStyle = [0.5, 0.5, 0.5]` 


References
----------

 - [CSSColorValue](https://drafts.css-houdini.org/css-typed-om-1/#colorvalue-objects)
 - [WHATWG discussion thread](https://github.com/whatwg/html/issues/5616)
