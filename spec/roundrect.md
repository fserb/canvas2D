RoundRect
=========
**Status**: explainer.

Allows to render rectangles with rounded corners.


Proposal
--------

```webidl
interface mixin CanvasRoundRect {
  // all doubles are unrestricted.
  void clearRoundRect(double x, double y, double w, double h, sequence<double> radius);
  void fillRoundRect(double x, double y, double w, double h, sequence<double> radius);
  void strokeRoundRect(double x, double y, double w, double h, sequence<double> radius);
};
```

Those methods are mostly equivalent to their `Rect` counterparts. `radius` specify
the radius of corners. Each corner is represented by a single radius.

If `radius.length == 1` then all 4 corners have the same length.

If `radius.length == 4` then each corner is specified, in order: top left, top right, bottom right, bottom left.


### Open issues and questions

- is `clearRoundRect` needed/desired/possible?
- is `sequence<double>` better than explicit list of radii?
- support integer as an optional parameter
- what happens to other radius lengths?


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.fillRoundRect(10, 10, 50, 50, [10]);
ctx.fillRoundRect(100, 10, 50, 50, [10, 10, 0, 10]);

```

Alternatives considered
-----------------------

### DOMRoundRect

Specify a `DOMRoundRect` object and make functions `*RoundRect(DOMRoundRect obj)`. It seems a bit at odds with the rest of Canvas2D APIs.

References
----------

None.
