RoundRect
=========
**Status**: explainer.

Addition to CanvasPath that allows users to render rectangles with rounded corners.


Rationale
---------

Almost all 2D APIs support a roundrect primitive.

Even thought, theoretically, one could reproduce this exiting path functions, it's hard to get this function right (with weird values of radius) and performant.


Proposal
--------

```webidl
interface mixin CanvasPath {
  // all doubles are unrestricted.
  void roundRect(double x, double y, double w, double h, sequence<double> radius);
};
```

`radius` specifies the radius of corners. Each corner is represented by a single radius.

If `radius.length == 1` then all 4 corners have the same length.

If `radius.length == 4` then each corner is specified, in order: top left, top right, bottom right, bottom left.


### Open issues and questions

- is `sequence<double>` better than explicit list of radii?
- support integer as an optional parameter
- what happens to other radius lengths?


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.beginPath();
ctx.roundRect(10, 10, 50, 50, [10]);
ctx.fill();

```

Alternatives considered
-----------------------

### DOMRoundRect

Specify a `DOMRoundRect` object and make functions `*RoundRect(DOMRoundRect obj)`. It seems a bit at odds with the rest of Canvas2D APIs.

### RoundRect as standalone drawing primitive

To make RoundRect more quickly accessible, it could exist on its own like fillRect and strokeRect:

```webidl
interface mixin CanvasRoundRect {
  // all doubles are unrestricted.
  void clearRoundRect(double x, double y, double w, double h, sequence<double> radius);
  void fillRoundRect(double x, double y, double w, double h, sequence<double> radius);
  void strokeRoundRect(double x, double y, double w, double h, sequence<double> radius);
};
```

Producing code like:
```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.fillRoundRect(10, 10, 50, 50, [10]);
ctx.fillRoundRect(100, 10, 50, 50, [10, 10, 0, 10]);
```

This has the benefit of producing one-liner versions of round rects, but does not allow the user to interact with `clip`, `isPointIn...`, `scrollToPath`. It would also make it impossible to draw multiple round rects with a single draw command.

References
----------

None.
