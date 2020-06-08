Batch drawImage
===============
**Status**: explainer.

Many web applications use `Canvas2D.drawImage` in sequence, where a large number of calls can occur on each frame. In those cases, Javascript call can be a strong bottleneck on rendering.

- near-native performance for sprite/tile based animation and games.
- easily polyfilled.


Rationale
---------

Batch image render is an expected and commom 2D API pattern. Usually, those functions exist to improve performance (by increasing max number of sprites to be rendered) due to pipelininig benefits. On top of that, Canvas2D can benefit for also reducing the number of Javascript calls necessary per blit.

Experiments have shown that `drawImage*Batch` can improve Canvas2D sprite rendering performance in the browser by at least 3-5x.


Proposal
--------

```webidl
interface mixin CanvasDrawImageBatch {
  void drawImagePositionBatch(CanvasImageSource source, (Float32Array or sequence<double>) drawParameters);
  void drawImageDestRectBatch(CanvasImageSource source, (Float32Array or sequence<double>) drawParameters);
  void drawImageSrcDestBatch(CanvasImageSource source, (Float32Array or sequence<double>) drawParameters);
  void drawImageTransformBatch(CanvasImageSource source, (Float32Array or sequence<double>) drawParameters);
  void drawImage3DTransformBatch(CanvasImageSource source, (Float32Array or sequence<double>) drawParameters);
};

CanvasRenderingContext2D includes CanvasDrawImageBatch;
OffscreenCanvasRenderingContext2D includes CanvasDrawImageBatch;
```

The `drawParameters` is interepreted as a sequence of draw commands, where each sequence has different size depending on the function:

- `drawImagePositionBatch`

  2 values per draw `dx, dy`.

  Equivalent to `drawImage(source, dx, dy)`.

- `drawImageDestRectBatch`

  4 values per draw `dx, dy, dwidth, dheight`.

  Equivalent to `drawImage(source, dx, dy, dwidth, dheight)`.

- `drawImageSrcDestBatch`

  8 values per draw `sx, sy, swidth, sheight, dx, dy, dwidth, dheight`.

  Equivalent to `drawImage(source, sx, sy, swidth, sheight, dx, dy, dwidth, dheight)`.

- `drawImageTransformBatch`

  10 values per draw `sx, sy, swidth, sheight, a, b, c, d, e, f`.

  Equivalent to `save(); transform(a, b, c, d, e, f); drawImage(sx, sy, swidth, sheight, 0, 0, 1, 1); restore();`

- `drawImage3DTransformBatch`

  20 values per draw `sx, sy, swidth, sheight, m11...m44`.

  Equivalent to `save(); transform(DOMMatrix(m11...m44)); drawImage(sx, sy, swidth, sheight, 0, 0, 1, 1); restore();`


Throws an `INDEX_SIZE_ERR` DOM Exception if the size of `drawParameters` is not a mulitple of the required length.


### Implementation

- A naive implementation (of calling the underlying `drawImage` multiple times) will still get performance improvements as it reduces Javascript overhead.
- Much less type checking of parameters.
- Allow UA to trully batch those calls.


### Open issues and questions

- Support for non-affine transforms on `drawImageTransformBatch`?
- Support for `sequence<CanvasImageSource>` as well as single image.
- Could we have less variants? Maybe remove `drawImageDestRectBatch`?


Example usage
-------------

```js
const ctx = document.createElement('canvas').getContext('2d');

const params = new Float32Array([0, 0, 15, 10];

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

Overloading is more performant costly, less explicit, and less friendly to feature detection in the future.


References
----------

- https://wiki.whatwg.org/wiki/Canvas_Batch_drawImage
