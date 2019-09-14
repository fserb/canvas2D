Batch drawImage
===============

Goals and Use Case
------------------

Many web applications use `Canvas2D.drawImage` in sequence, where a large number of calls can occur on each frame. In those cases, Javascript call can be a strong bottleneck on rendering.

- near-native performance for sprite/tile based animation and games.
- easily polyfilled.

Proposal
--------

```webidl

interface CanvasRenderingContext2D {
  void drawImagePositionBatch(CanvasImageSource source, Float32Array drawParameters);
  void drawImageDestRectBatch(CanvasImageSource source, Float32Array drawParameters);
  void drawImageSrcDestBatch(CanvasImageSource source, Float32Array drawParameters);
  void drawImageSrcTransformBatch(CanvasImageSource source, Float32Array drawParameters);
}
```

The `drawParameters` is interepreted as a sequence of draw commands, where each sequence has different size depending on the function:

- `drawImagePositionBatch`: 2 values: `dx, dy`.
  Equivalent to `drawImage(source, dx, dy)`.
- `drawImageDestRectBatch`: 4 values: `dx, dy, dwidth, dheight`.
  Equivalent to `drawImage(source, dx, dy, dwidth, dheight)`.
- `drawImageSrcDestBatch`: 8 values: `sx, sy, swidth, sheight, dwidth, dheight`.
  Equivalent to `drawImage(source, sx, sy, swidth, sheight, dwidth, dheight)`.
- `drawImageSrcTransformBatch`: 10 values: `sx, sy, swidth, sheight, a, b, c, d, e, f`.
  Equivalent to `save(); transform(a, b, c, d, e, f); drawImage(sx, sy, swidth, sheight, 0, 0, 1, 1); restore();`

Throws an `INDEX_SIZE_ERR` DOM Exception if the size of `drawParameters` is not a mulitple of the required length.


### Open issues

- Support for non-affine transforms on `drawImageSrcTransformBatch`?
- Support for `sequence<CanvasImageSource>` as well as single image.
- Could we have less variants? Maybe remove `drawImageDestRectBatch`?

### Implementation

- A naive implementation (of calling the underlying `drawImage` multiple times will still get performance improvements as it reduces Javascript overhead.
- Much less type checking of parameters.
- Ability for implementations to trully batch those calls.


Example usage
-------------

```js
const ctx = document.createElement('canvas').getContext('2d');

params = new Float32Array([0, 0, 15, 10];

fetch('sprite.png').then(createImageBitmap).then(source => {
  // draws 2 instances of sprite.png at (0,0) and (15, 10).
  ctx.drawImagePositionBatch(source, params);
});
```


Alternatives considered
-----------------------

### Overload approach

```webidl
enum CanvasDrawImageParameterFormat { position, destination-rectangle,
  source-and-destination-rectangles, source-rectangle-and-transform};

void drawImageBatch(CanvasImageSource image, ParameterFormat parameterFormat,
  Float32Array drawParameters);

```

Overloading is more performant costly, less explicit, less friendly to feature detection in the future.


References
----------

- https://wiki.whatwg.org/wiki/Canvas_Batch_drawImage
