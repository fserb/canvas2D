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
  void roundRect(unrestricted double x, unrestricted double y, unrestricted double w, unrestricted double h, sequence<(unrestricted double or DOMPoint)> radii);
};
```

`radius` specifies the radius of corners. Each corner is represented by a single radius.

If `radii.length == 1` then all 4 corners have the same length.

If `radii.length == 2` then the first value applies to the top-left and bottom-right corners, and the second value applies to the top-right and bottom-left corners.

If `radii.length == 3` then the first value applies to the top-left corner, the second value applies to the top-right and bottom-left corners, and the third value applies to the bottom-right corner.

If `radii.length == 4` then each corner is specified, in order: top-left, top-right, bottom-right, bottom-left.

If `w` and `h` are both greater than  or equal to 0, or if both are smaller than 0, then the primitive is drawn clockwise. Otherwise, it is drawn conterclockwise.

When `w` is negative, the rounded rectangle is flipped horizontally, which means that the radius values that apply to the left corners, are actual used on the right and vice versa. Similarly, when `h` is negative, the rounded rect is flipped vertically.

When a value `r` in `radii` is a `DOMPoint`, the corresponding corner(s) are drawn as elliptical arcs whose x and y radii are equal to `r.x` and `r.y`, respecively.

When a value `r` in `radii` is a `double`, the corresponding corner(s) are drawn as circular arcs of radius `r`.

When the sum of the radii of two corners of the same edge is greater than the length of the edge, the all the radii of the rounded rectangle are scaled by a factor of len/(r1+r2). If multiple edges have this property, the scale factor of the edge with the smallest scale factor is used.  This is consistent with CSS behaviour.

If a value in `radii` is a negative number, then roudRect() throws an `IndexSizeError` DOM Exception.

If a value in `radii` is a `DOMPoint` whose `x` or `y` attributes are negative numbers, then roundRect() throws an `IndexSizeError` DOM Exception.

If any of `x`, `y`, `width` or `height` ar non-finite numbers, or if a value in radii is a non-finite number, or if a value of `radii` is a DOMPoint who `x` or `y` attributes are non-finite numbers, the roundRect aborts without throwing an exception and without adding anything to the current path.


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
