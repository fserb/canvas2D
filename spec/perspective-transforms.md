Perpsective transforms
======================
**Status**: explainer.

Allow for perspective (non-affine) 2D transforms. Non-affine transforms are
transformations where parallel lines don't remain parallel after the transform.


Proposal
--------

```webidl
interface mixin CanvasTransform {
  // Already exists:
  [NewObject] DOMMatrix getTransform();
  void resetTransform();

  void transform(unrestricted double a, unrestricted double b, unrestricted double c, unrestricted double d, unrestricted double e, unrestricted double f);
  void setTransform(unrestricted double a, unrestricted double b, unrestricted double c, unrestricted double d, unrestricted double e, unrestricted double f);

  // updates:
  void scale(unrestricted double x, unrestricted double y, optional unrestricted double z);
  void translate(unrestricted double x, unrestricted double y, optional unrestricted double z);
  void rotate(unrestricted double angleZ, optional unrestricted double angleY, optional unrestricted dobule angleX);

  void setTransform(optional (DOMMatrix2DInit or DOMMatrixInit) transform = {});
  void transform((DOMMatrix2DInit or DOMMatrixInit transform);
};
```

We now allow a full 4x4 Matrix as the state of a Canvas transform. We also create
a new `transform()` function that multiplies the current matrix by the passed
parameter.

Finally, we support `scale`/`translate`/`rotate` with extra optional parameters.


### Open issues and questions

* update `transform()` with open parameters `(a, b, c, d, e, f, g, h...)`?
* scale3d/translate3d/rotate3d/perspective (like CSS)?
* do we need to specify non-affine perspective texture transforms for drawImage?
* support pre-multiply for transform?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// TBD
```

Alternatives considered
-----------------------

none


References
----------

- https://drafts.csswg.org/css-transforms-2
- https://drafts.fxtf.org/geometry/#DOMMatrix
