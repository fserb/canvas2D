Array color input
=================
**Status**: explainer.

Allow RGB and RGBA colors to be specified by a sequence of floats.


Proposal
--------

```webidl
interface mixin CanvasFillStrokeStyles {
  attribute (DOMString or sequence<unrestricted double> or CanvasGradient or CanvasPattern) strokeStyle;
  attribute (DOMString or sequence<unrestricted double> or CanvasGradient or CanvasPattern) fillStyle;
};

interface mixin CanvasShadowStyles {
  attribute (DOMString or sequence<unrestricted double>) shadowColor;
};

interface CanvasGradient {
  void addColorStop(double offset, DOMString color);
  void addColorStop(double offset, sequence>unrestricted double> color);
}
```

when a sequence is presented as any of the color parameters:
1. if length is 3, parse as `[R, G, B]`
2. if length is 4, parse as `[R, G, B, A]`
3. else, do nothing.

`R, G, B` are normalized from 255, i.e. `[1.0, 0.5, 0.0]` is equivalent to `rgb(255, 127, 0)`.

Alpha is clamped to `[0, 1]`.


### Open issues and questions

- Is it possible or desired to support other formats like YUV?
- Are UA allowed to use more than 255 values for colors?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = [0.2, 0.33, 0.1, 0.5];
ctx.strokeStyle = [1.0, 0.0, 0.0];

```

Alternatives considered
-----------------------

### Include color format

Allow sequences of type `['rgb', 0.5, 0.5, 0.5]` and allow other formats.


References
----------

None.
