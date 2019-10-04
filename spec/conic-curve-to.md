ConicCurveTo
=========
**Status**: explainer.

Draw curves based on conic sections. These are useful as they can represent
circular arcs exactly.

Proposal
--------

```webidl
interface mixin Canvas {
  // all doubles are unrestricted.
  void conicCurveTo(double cpx, double cpy, double x, double y, double weight);
};
```
This is a similar interface to [`bezierCurveTo`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo). `conicCurveTo` defines a curve from the starting point (_p_) to
destination point (_d_) that bends towards control point (_c_) as weighted by
`weight`.

 - `x`, `y` are the coordinates of _d_.
 - `cpx`, `cpy` are the coordinates of _c_.
 - `weight` defines how much the line moves towards _c_:
   - `weight = 0` defines a straight line from the _p_ to _d_.
   - `weight = 1` defines a quadratic path.
   - `weight < 1` is elliptical, while `weight > 1` is hyperbolic
   - If the line from the _pc_ makes a 90&deg; angle with the line from the _cd_
   , then `weight = sqrt(2)/2` defines a circular arc. This can be used for
   rounded corners.

### Open issues and questions

- Is this functionality needed or desired by developers?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.beginPath();
ctx.moveTo(100, 100); // Starting Point is (100, 100)
// Control Point is (200, 100)
// End Point is (200, 200)
// Weight is 1
ctx.conicCurveTo(200, 100, 200, 200, 1);
ctx.stroke();

```

The above code will produce the following curve, shown in green.
Lines _pc_ and _cd_ are shown in black:

![](../images/conicCurveTo.png)

References
----------

 - Skia: [SkPath.conicTo](https://skia.org/user/api/SkPath_Reference#SkPath_conicTo)
 - [Conic Sections](https://en.wikipedia.org/wiki/Conic_section)
