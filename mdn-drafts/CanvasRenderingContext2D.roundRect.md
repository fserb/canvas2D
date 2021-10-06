---
recipe: roundRect
title: 'CanvasRenderingContext2D.roundRect()'
mdn_url: /en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
specifications: https://html.spec.whatwg.org/#dom-context-2d-roundrect
browser_compatibility: api.CanvasRenderingContext2D.roundRect
---


## Description

The `roundRect` method of the `CanvasRenderingContext2D` interface adds a rounded rectangle to the 
current sub-path.

## Syntax

`CanvasRenderingContext2D.roundRect(x, y, width, height, radii)`

### Parameters
<dl>
  <dt><em>x</em></dt>
  <dd>A double that represents the x-axis (horizontal) coordinate of the rectangle's starting point.</dd>

  <dt><em>y</em></dt>
  <dd>A double that represents the y-axis (vertical) coordinate of the rectangle's starting point.</dd>

  <dt><em>width</em></dt>
  <dd>A double that represents the rectangle's width. A positive value means the path is drawn
  clockwise, and a negative value means it's drawn counterclockwise and flips the rectangle
  horizontally along the `y` axis. That means the radius values that were applied to the left corners
  are now applied to the right.</dd>

  <dt><em>height</em></dt>
  <dd>A double that represents the rectangle's height. A positive value means the path is drawn
  clockwise, and a negative value means it's drawn counterclockwise and flips the rectangle
  vertically along the `x` axis. That means the radius values that applied to the top corners are now applied
  to the bottom.</dd>

  <dt><em>radii</em></dt>
  <dd>An array of radius `r`, and each `r` in `radii` could be a double or an object with `{x, y}` properties. If `r` is
  a double, the corresponding corner(s) are drawn as a cicurlar arc with radius `r`; if `r` is an
  object, the correspondinf corner(s) are drawn as
  [elliptical arc](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse)
  whose `radiusX` and `radiusY` are equal to `x` and `y`, respectively. `r`, `x` and `y` must be
  non-negative:

  * If `radii`'s size is 1, then arc created by `radii[0]` replaces all 4 corners of rectangle.

  * If `radii`'s size is 2, then the arc created by `radii[0]` replaces the upper left and lower
  right corners of the rectangle; the arc created by `radii[1]` replaces the upper right and lower
  left corners of rectangle.

  * If `radii`'s size is 3, then the arc created by `radii[0]` replaces the upper left corner; the
  arc created by `radii[1]` replaces the upper right and lower left corners; and the arc created by
  `radii[2]` replaces the lower right corner of rectangle.


  * If `radii`'s size is 4, then the arc createed by radii[0], radii[1], radii[2] and radii[3]
  replaces upper left, upper right, lower right and lower left corner of rectangle, respectively.

  * If `radii`'s size is not any of the listed values above, then roundRect aborts and returns an
  RangeError.

  Note that if the sum of the radii of two corners of the same edge is greater than the length of
  that edge, all the `radii` of the rounded rectangle are scaled by a factor of length / (r1 + r2).
  If multiple edges have this property, the scale factor of the edge with the smallest scale factor
  is used.
</dd>
</dl>

## Examples


### Drawing roundRect with circular arc

The following example draws four `roundRect` images with `raddi` sizes equal to 1, 2, 3 or 4. `r` is a double.

```js
const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
ctx.strokeStyle = '#0f0';
ctx.lineWidth = 5;
// radii = [20] and r = 20
ctx.roundRect(50, 50, 100, 100, [20]);
// radii = [20, 40], r1 = 20 and r2 = 40
ctx.roundRect(200, 50, 100, 100, [20, 40]);
// radii = [10, 25, 40], r1 = 10, r2 = 25 and r3 = 40
ctx.roundRect(50, 200, 100, 100, [10, 25, 40]);
// radii = [5, 15, 30, 50], r1 = 5, r2 = 15, r3 = 30 and r4 = 50
ctx.roundRect(200, 200, 100, 100, [5, 15, 30, 50]);
ctx.stroke();
```

### Drawing roundRect with elliptical arc

The following example draws a rooundRect with a different elliptical arc.

```js
const canvas = document.createElement('canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
ctx.strokeStyle = '#0f0';
ctx.lineWidth = 5;
ctx.roundRect(50, 50, 120, 120, [new DOMPoint(25, 50)]);

ctx.roundRect(210, 50, 120, 120, [new DOMPoint(20, 50), new DOMPoint(50, 20), new DOMPoint(20, 50), 
  new DOMPoint(50, 20)]);

var DOMPointInit = {
  x: 25,
  y: 50
}
ctx.roundRect(50, 210, 120, 120, [DOMPointInit]);

ctx.roundRect(210, 210, 120, 120, [new DOMPoint(20, 50), new DOMPoint(50, 20), 50, 50]);
ctx.stroke();
```

## See also
[CSS bordere-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)