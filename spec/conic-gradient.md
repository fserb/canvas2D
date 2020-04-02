Conic gradient
==============
**Status**: explainer.

Adds conic gradients.

This is equivalent to CSS's `conic-gradient()` function.


Proposal
--------

```webidl
interface mixin CanvasFillStrokeStyles {
  // addition:
  CanvasGradient createConicGradient(unrestricted double x, unrestricted double y, unrestricted double startAngle);
};
```

When using conic gradients `CanvasGradient` stops are normalized from 0 to 1 (as opposed to using radians). This is consistent with other gradients that use normalized values.


### Open issues and questions

- expressing stops in values from 0 to 1 instead of radians?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const grad = ctx.createConicGradient(100, 100, Math.PI/4);

grad.addStop(0, "orange");
grad.addStop(0.25, "yellow");
grad.addStop(0.5, "green");
grad.addStop(0.75, "blue");
grad.addStop(1, "red");

ctx.fillStyle = grad;
ctx.fillRect(0, 0, 200, 200);
```

Will result in image:

![conic gradient](../images/conic-gradient.png)



Alternatives considered
-----------------------

none.

References
----------

- https://developer.mozilla.org/en-US/docs/Web/CSS/conic-gradient
