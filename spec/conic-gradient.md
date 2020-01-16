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
  CanvasGradient createConicGradient(unrestricted double x, unrestricted double y);
};
```

When using conic gradients `CanvasGradient` stops are measured in radians.


### Open issues and questions

- expressing stops in values from 0 to 1 instead of radians?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const grad = ctx.createConicGradient(100, 100);

grad.addStop(0, "red");
grad.addStop(Math.PI / 2, "oranga");
grad.addStop(Math.PI, "yellow");
grad.addStop(Math.PI * 3 / 2, "green");
grad.addStop(2 * Math.PI, "blue");

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
