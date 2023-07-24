# Layers

**Status**: explainer.

## Goals
Provide a simple and high-performance canvas 2D layer API that can be used to group multiple draw calls on which filters can be applied as a whole.

## Non-goals
Provide a means for recording and replaying draw commands multiple times. This is an orthogonal concern with a completely separate set of costs and benefits. It has been previously suggested in the [Recorded Pictures](https://github.com/fserb/canvas2D/blob/master/spec/recording.md) proposal and should be pursued separately.

## Rationale

The only current solution for applying a filter, shadow, blur or compositing to a set of draw operations (as opposed to a single one) is to draw to a temporary canvas and then draw the temporary canvas into the final destination. This option is complex to use, not easily discovered by web developers and prevents the browser from doing certain optimizations.

This proposal adds a simple and efficient API for creating layers to be drawn as a single unit. Filters, blending and compositing operations can be applied when drawing the layer's final content onto the destination. This is more user friendly than using a temporary canvas and allows the browser to implement optimizations, like:
 - Automatically decide what's the best dimension of the temporary image buffer. The browser will produce the drawing equivalent to having a temporary canvas with the minimum size required, given the current transform/clip.
 - Improve performance and memory usage by detecting whether the layers can be drawn in-place to the canvas, without the need for a temporary texture.
 - Allow the browser to render layer content pixel-aligned with underlying canvas, therefore removing the need for resampling, boosting performance and image quality.

## Proposal

```webidl
typedef record<DOMString, any> CanvasFilterPrimitive;
typedef (CanvasFilterPrimitive or
         sequence<CanvasFilterPrimitive>) CanvasFilterInput;

dictionary BeginLayerOptions {
  CanvasFilterInput? filter = null;
};

interface mixin CanvasLayers {
  undefined beginLayer(optional BeginLayerOptions options = {});
  undefined endLayer();
};
```

Layers are created by calling `beginLayer()` on the context and terminated by calling `endLayer()`. The layer API does not use a separate layer context: any draw calls performed on the main context between calls to `beginLayer()` and `endLayer()` are considered part of that layer. `beginLayer()` and `endLayer()` are nestable, so layers can be created and drawn within layers. The context must therefore keep a stack of active layers and apply draw calls on the layer at the top of this stack. [See here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.35wlbbo9qx59) for an analysis of different API designs considered.

Layers behave as if all the draw calls they contain are rendered on a separate texture. That texture is then rendered in the canvas (or the parent layer) with the drawing state of the context as it was when `beginLayer()` was called (e.g. globalAlpha, globalCompositeOperation, shadow, etc. are applied on the filter's result). Image smoothing only applies to individual draw calls, not on layer result textures ([more on this below](#current-transformation-matrix-clip-and-image-smoothing)).

Optionally, `beginLayer()` can be called with a filter as argument, in which case the layer's resulting texture will be rendered in the canvas using that filter. Filters are specified as a CanvasFilterInput object ([originally proposed here](https://github.com/whatwg/html/issues/5621)), essentially describing SVG filters with a JavaScript syntax. [See below](#possible-api-improvements) for possible future improvements, [and here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.52ab2yqq661g) for a full analysis of alternatives considered.

`beginLayer()` and `endLayer()` save and restore the full current state of the context, similarly to `save()` and `restore()`. `beginLayer()`/`endLayer()` and `save()`/`restore()` must therefore operate on the same stack, which must keep track of both the layers and rendering state nesting.

A subset of the rendering state we'll call **layer rendering attributes** are applied on the layer's resulting texture. To make sure that these are not applied twice (once on the draw calls in the layer and once on the layer's result), these attributes must be resetted to their default values at the beginning of the layer. `endLayer()` will restore them to the value they had when `beginLayer()` was called. The **layer rendering attributes** are:
- globalAlpha
- globalCompositeOperation
- shadowOffsetX
- shadowOffsetY
- shadowColor
- shadowBlur

## Example usage

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.globalAlpha = 0.5; 

ctx.beginLayer({filter: {name: 'gaussianBlur', stdDeviation: 4}});

ctx.fillStyle = 'rgba(225, 0, 0, 1)';
ctx.fillRect(50, 50, 75, 50);
ctx.fillStyle = 'rgba(0, 255, 0, 1)';
ctx.fillRect(70, 70, 75, 50);
ctx.endLayer();
```

Would produce the same outcome as,

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const canvas2 = document.createElement('canvas');
const ctx2 = canvas.getContext('2d');
ctx2.fillStyle = 'rgba(225, 0, 0, 1)';
ctx2.fillRect(50, 50, 75, 50);
ctx2.fillStyle = 'rgba(0, 255, 0, 1)';
ctx2.fillRect(70, 70, 75, 50);

ctx.globalAlpha = 0.5;
ctx.filter = 'blur(4px)';
ctx.drawImage(canvas2, 0, 0);
```

Filters can also be specified as a list, to chain filter effects:
```js
ctx.beginLayer({filter: [
  {name: 'gaussianBlur', stdDeviation: 4},
  {name: 'dropShadow', dx: 5, dy: 5}
]});
```

## Possible API improvements
In addition to supporting a `CanvasFilterInput` argument, we could also support a standalone `CanvasFilter` objects. This could provide optimization opportunities by allowing filter to be parsed and resolved once and reused in multiple layers. Note that filters like `dropShadow` can have colors that depends on the Canvas element style (e.g. `currentColor`, `color-scheme`, `forced-colors`, etc.), meaning that these filters can only be entirely resolved once they're used in a particular context.

```webidl
typedef record<DOMString, any> CanvasFilterPrimitive;
typedef (CanvasFilterPrimitive or
         sequence<CanvasFilterPrimitive>) CanvasFilterInput;

[
    Exposed=(Window, Worker)
] interface CanvasFilter {
    constructor(CanvasFilterInput init);
   
};

dictionary BeginLayerOptions {
  (CanvasFilterInput or CanvasFilter)? filter = null;
};

interface mixin CanvasLayers {
  undefined beginLayer(optional BeginLayerOptions options = {});
  undefined endLayer();
};
```

Example usage:
```js
// No filter:
ctx.beginLayer();

// Without intermediate CanvasFilter object:
ctx.beginLayer({filter: {name: 'gaussianBlur', stdDeviation: 4}});

// Composite filters without a CanvasFilter object:
ctx.beginLayer(
  {filter: [{name: 'gaussianBlur', stdDeviation: 4},
            {name: 'dropShadow', dx: 5, dy: 5}]});

// CanvasFilter object:
const reusableFilter = new CanvasFilter(
  {name: 'gaussianBlur', stdDeviation: 4});
ctx1.beginLayer({filter: resuableFilter});
ctx2.beginLayer({filter: resuableFilter});
```

This API would be easily extendable, allowing for more arguments to be added to `beginLayer` if we ever need to. For instance, beginLayer could accept parameters like `alpha`, `compositeOperation` or `antialiasing`:
```js
ctx.beginLayer({filter: [{name: 'gaussianBlur', stdDeviation: 2},
                         {name: 'dropShadow', dx: 5, dy: 5}],
                compositeOp: "source-over",
                antialiasing: "disabled"});
```

## Corner cases

### Current transformation matrix, clip and image smoothing
There are two ways we can view transformations. Take for instance:
```js
ctx.translate(100, 100);
ctx.rotate(Math.PI);
ctx.fillRect(10, 10, 100, 100);
```

If we read the transformations in the order they are specified, we would say that the transformations apply to the coordinate system. Here, we would be translating the whole canvas' coordinate system by [-100, -100], rotating it by -PI, and drawing the rectangle at position [10, 10]. If instead we read the transformation in reverse order, we would say that we are drawing a rectangle at position [10, 10], rotating that rectangle by PI, and then translating it by [100, 100]. Either option would produce the exact same result.

When thinking about layers however, these two options might not always be equivalent. Take for instance:
```js
ctx.translate(100, 100);
ctx.rotate(0.2 * Math.PI);
ctx.beginLayer();
ctx.rotate(0.8 * Math.PI);
ctx.fillRect(10, 10, 100, 100);
ctx.endLayer();
```

Here, if we transform the coordinate system, the rectangle would be drawn at its exact final position. If instead we rotate drawn primitives, we would need to first draw the rectangle partly rotated in the layer's temporary texture, and then rotate that layer's texture to its final position. This option would require the layer's texture to be re-sampled, which would lower performance and image quality.

One of the main goals of this proposal is to unlock a high performance code path to implement layers. We therefore want to allow browsers to optimize away layer resampling. To make this possible, a layer must know what the parent transformation is. Therefore, the current transformation matrix (CTM) and clip cannot be resetted when entering a layer. Calling `ctx.getTransform()` from within a layer will return the global transform, including all transformations in the parent and current layers.

Similarly, to allow browsers to optimize away layer resampling, the `imageSmoothingEnabled` and `imageSmoothingQuality` states cannot apply to the layer's result texture. In addition, if smoothing was to be applied on every layer output, the image quality would degrade on every layer nesting level we add. [See here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.qo8c65b01d75) for an example of the impact of either option on image quality.

### Unclosed layers
Layers only gets filtered and composited to their parent bitmap when they are closed. Accessing the canvas bitmap pixels while a layer is opened is a malformed operation.

APIs like `putImageData()` in particular are incompatible with unclosed layers. [By design](https://html.spec.whatwg.org/multipage/canvas.html#pixel-manipulation), `putImageData()` writes pixels to the canvas wholesale, bypassing globalAlpha, shadow attributes and globalCompositeOperation. To be consistent with this, `putImageData()` must also bypass layers and write directly to the canvas underneath, or else, the pixels written would be affected by the layer's filter, blending or compositing. `putImageData()` can't however sidestep the layer and write directly to the canvas because when `endLayer()` is called, the layer content would overwrite the pixels written by `putImageData()`. For instance:
```
ctx.beginLayer();
ctx.fillRect(0, 0, 100, 100);

// Draws `img` to the canvas:
ctx.putImageData(img, 0, 0);

// When closing the layer, the pixels drawn by `putImageData` effectively
// gets overwritten by a previous `fillRect`.
ctx.endLayer();
```

To give a clear message to web developers, and make sure web sites do not start depending on degenerate API uses, all APIs directly accessing the canvas bitmap pixels while layers are opened must throw an exception or returned a failed promise. Example APIs are:

Raises an exception:
 - `CanvasRenderingContext2D.drawImage(canvas, 0, 0);`  (reading pixels from `canvas`).
 - `CanvasRenderingContext2D.getImageData(...)`
 - `CanvasRenderingContext2D.putImageData(...)`
 - `HTMLCanvasElement.toBlob(...)`
 - `HTMLCanvasElement.toDataURL(...)`

Returns failed promise:
 - `createImageBitmap(canvas)`
 - `OffscreenCanvas.convertToBlob(...)`

The canvas bitmap is also read on render opportunities, when the script ends for instance, or if it pauses on an `await` statement. Because there is no way to raise an exception in these cases, we have no other choice but present the content of the canvas regardless of unclosed layers. This already works with the `save()`/`restore()` API: the canvas can be presented even if there are pending saves and implementations have to maintain the canvas state stack alive across JavaScript task executions. To be consistent with this, pending layers must also be kept alive across tasks.

This leaves us with two options regarding the content of the canvas presented when there are unclosed layers:
 1. Present the content of unclosed layers, by automatically closing all layers at the end of the JavaScript task, reading the canvas output bitmap and then restore canvas state stack (reopening the layers) before the next task starts executing.
 2. Don't present unclosed layers, but hold onto their content so that it could be rendered in a future frame if layers are finally closed.

Neither options are perfect, but more importantly, this is not a feature, it's the handling of an invalid API use. For that reason, we should avoid solutions that adds complexity or lowers performance. In that sense, option 1 is preferred because it adds no complexity or overhead beyond the state stack management we already have to do. Option 2 on the other hand would require adding support for partial flushes, rendering all draw calls up to the first `beginLayer` and then carrying over a potentially large list of pending draw calls across JavaScript tasks. Regardless, a console warning message can be printed to warn developers that they are presenting unclosed layers.

See an [analysis of alternatives considered here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.kwadqd24dwtw).

### Unmatched calls
An `endLayer()` without a `beginLayer()` is considered malformed and throws an exception. See [here for an analysis of the alternatives considered](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.dilmo33w0023).

### Interaction with `save()`/`restore()`
To be consistent with how [unmatched calls](#unmatched-calls) are handled, invalid mixes of `save()`/`restore()` and `beginLayer()`/`endLayer()` calls are considered malformed and throws an exception. For instance, the following are all considered malformed and throw exceptions:

```js
save(); endLayer();  // No matching beginLayer() in current save() level.
beginLayer(); save(); endLayer();  // No matching beginLayer() in current save() level.
save(); beginLayer(); restore();  // No matching save() in current layer.
beginLayer(); restore();  // No matching save() in current layer.
```

### Call to `ctx.reset()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-reset), calling `ctx.reset()` resets the whole canvas and brings it back to its original default state. This includes clearing the context's drawing state stack. Therefore, calling `ctx.reset()` after calls to `ctx.beginLayer()` must discard all pending layers. As described in the [Unclosed Layers section](#unclosed-layers), doing `ctx.beginLayer(); ctx.reset(); ctx.endLayer();` is malformed with `endLayer()` throwing an exception since `endLayer()` has no matching `beginLayer()` (it was discarded by `reset()`).

### Call to `ctx.clearRect()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#drawing-rectangles-to-the-bitmap) `ctx.clearRect` behaves like `crx.fillRect`, with the difference being that it paints with transparent black instead of the current fill style. Therefore, calling `ctx.clearRect()` inside a layer writes transparent black to the pixels in that layer, not directly in the parent canvas or layer.

### Call to `ctx.drawImage()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#drawing-images), `drawImage()` is affected by globalAlpha, attributes and globalCompositeOperation. To be consistent, calling `drawImage()` inside a layer writes the image to that layer, which will in turn be filtered/blended/composited to the parent.

### Interaction with the current default path
When drawing paths, only the calls that draw pixels (functions in the [CanvasDrawPath interface](https://html.spec.whatwg.org/multipage/canvas.html#canvasdrawpath)) are impacted by layers. The [*current default path* not being part of the drawing state](https://html.spec.whatwg.org/multipage/canvas.html#drawing-paths-to-the-canvas), it's unaffected by the opening and closing of layers. Therefore, this code:
```js
  ctx.beginLayer({filter: {name: "gaussianBlur", stdDeviation: 2}});
  ctx.beginPath();
  ctx.rect(40, 40, 75, 50);
  ctx.stroke();
  ctx.endLayer();
```

is equivalent to:
```js
  ctx.beginPath();
  ctx.rect(40, 40, 75, 50);
  ctx.beginLayer({filter: {name: "gaussianBlur", stdDeviation: 2}});
  ctx.stroke();
  ctx.endLayer();
```

### Interaction with `ctx.filter = ...;`
Some Canvas2D implementations (Chrome and Firefox) shipped a feature where filters can be specified on the context directly, by doing `ctx.filter = <some filter>`. For those implementations, the context filter doesn't apply to layers. We do not want to encourage developers to use `ctx.filter` because that feature isn't supported by all browser and because using it is bad for performance. Indeed, `ctx.filter` requires the browser to implicitly create a layer for each individual draw calls. Specifying filters via `beginLayer` makes this cost explicit.

See [here for an analysis of the alternatives considered](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.6u3unyd2kkpo).

### Filter dimensions
In SVG, filters can have their own dimensions, specified using the `width`, `height`, `x`, and `y` properties. Canvas layers can do the same things using clipping.

For instance, the following two snippets produce the same results:
```html
<svg xmlns="http://www.w3.org/2000/svg"
     width="70" height="70" viewBox="0 0 70 70"
     color-interpolation-filters="sRGB">
  <filter id="blur" y="20" x="20" width="30" height="30" filterUnits="userSpaceOnUse">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
  </filter>
  <rect x="10" y="10" width="50" height="50" fill="magenta" filter="url(#blur)"/>
</svg>
```

```js
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const region = new Path2D();
region.rect(20, 20, 30, 30);
const ctx = canvas.getContext('2d');
ctx.clip(region);
ctx.beginLayer({filter: {name: "gaussianBlur", stdDeviation: 5}});
ctx.clip(region);
ctx.fillStyle = 'magenta';
ctx.fillRect(10, 10, 50, 50);
ctx.endLayer();
```

## Alternatives considered

A full analysis of all considered alternatives can be found in [this document](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#)

## References

Some examples of the same idea outside Canvas.
- [*SaveLayer*](https://api.flutter.dev/flutter/dart-ui/Canvas/saveLayer.html) method in Flutter at Google.
- [*BeginTransparencyLayer*](https://developer.apple.com/documentation/coregraphics/cgcontext/1456011-begintransparencylayer) method in Core Graphics at Apple.
- [*SaveLayer*](https://api.skia.org/classSkCanvas.html) method in Skia.
