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

Notes on Workers
----------------

CSSColorValue types can take doubles or CSS unit values as inputs. The CSS namespace is not (yet) exposed to workers an there are some security concerns involved with doing so. For example, CSS.registerProperty unconditionally casts the ExecutionContext to LocalDOMWindow and then acts on it. This sort of type confusion is a common source of security vulnerability.

We can instead expose only the CSS unit value types that can be used to create CSSColorValues, these include:
  - CSS.percent
  - CSS.number
  - CSS.deg
  - CSS.rad
  - CSS.grad

CSSUnitValue, CSSNumericValue and CSSStyleValue should also get exposed.

We should also consider exposing:
  - CSSMathSum
  - CSSMathMin
  - CSSMathProduct
  - CSSMathMax

Alternatives considered
-----------------------

### Array color input

`ctx.fillStyle = [0.5, 0.5, 0.5]` 


References
----------

 - [CSSColorValue](https://drafts.css-houdini.org/css-typed-om-1/#colorvalue-objects)
 - [WHATWG discussion thread](https://github.com/whatwg/html/issues/5616)
