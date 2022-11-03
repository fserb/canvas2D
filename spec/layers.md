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
interface mixin CanvasState {
  // extending original
  undefined beginLayer(optional CanvasFilter filter);
  undefined endLayer();
};
```

Layers are created by calling `beginLayer()` on the context and terminated by calling `endLayer()`. The layer API does not use a separate layer context: any draw calls performed on the main context between calls to `beginLayer()` and `endLayer()` are considered part of that layer. `beginLayer()` and `endLayer()` are nestable, so layers can be created and drawn within layers. The context must therefore keep a stack of active layers and apply draw calls on the layer at the top of this stack. [See here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.35wlbbo9qx59) for an analysis of different API designs considered.

Layers behave as if all the draw calls they contain are rendered on a separate texture. That texture is then rendered in the canvas (or the parent layer) with the drawing state of the context as it was when `beginLayer()` was called (e.g. globalAlpha, globalCompositeOperation, shadow, etc. are applied on the filter's result). Image smoothing only applies to individual draw calls, not on layer result textures ([more on this below](#current-transformation-matrix-clip-and-image-smoothing)).

Optionally, `beginLayer()` can be called with a filter as argument, in which case the layer's resulting texture will be rendered in the canvas using that filter. Filters are specified as a [CanvasFilter](https://github.com/whatwg/html/issues/5621) object. [See below](#alternative-filter-api) for possible future improvements, [and here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.52ab2yqq661g) for a full analysis of alternatives considered.

`beginLayer()` and `endLayer()` save and restore the full current state of the context, similarly to `save()` and `restore()`. `beginLayer()`/`endLayer()` and `save()`/`restore()` must therefore operate on the same stack, which must keep track of both the layers and rendering state nesting.

A subset of the rendering state we'll call **layer rendering attributes** are applied on the layer's resulting texture. To make sure that these are not applied twice (once on the draw calls in the layer and once on the layer's result), these attributes must be resetted to their default values at the beginning of the layer. `endLayer()` will restore them to the value they had when `beginLayer()` was called. The **layer rendering attributes** are:
- globalAlpha
- globalCompositeOperation
- shadowOffsetX
- shadowOffsetY
- shadowColor
- shadowBlur
- filter

## Example usage

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.globalAlpha = 0.5; 

ctx.beginLayer(new CanvasFilter({filter: "gaussianBlur", stdDeviation: 4}));

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

## Alternative filter API
In addition to supporting `CanvasFilter`, we could support a syntactic sugar where `CanvasFilter` arguments could be passed directly to `beginLayer`, removing the need to create actual CanvasFilter objects:
```js
undefined beginLayer(optional (CanvasFilter or object or FrozenArray<object>) filter);
```

Example usage:
```js
// No filter:
ctx.beginLayer();

// CanvasFilter object:
ctx.beginLayer(new CanvasFilter({filter: "gaussianBlur", stdDeviation: 4}));

// Without intermediate CanvasFilter object:
ctx.beginLayer({filter: "gaussianBlur", stdDeviation: 4});

// Composite filters without a CanvasFilter object:
ctx.beginLayer([{filter: "gaussianBlur", stdDeviation: 4},
                {filter: "turbulence", frequency: 0.05, numOctaves: 2}]);
```

If we ever wanted to add more arguments to `beginLayer`, like `alpha` or `compositeOperation` however, we might want to revisit the `CanvasFilter` proposal to allow syntax like:
```js
ctx.beginLayer({filter: [{gaussianBlur: {stdDeviation: 2}},
                         {turbulence: {frequency: 0.05, numOctaves: 2}}],
                compositeOp: "source-over"});
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
When a frame is rendered (via any render opportunities: end of JS task, call to `drawImage(canvas, ...)`, etc.), a layer that was not closed will be rasterized, and in the next frame the layer starts empty and can still be used (and closed). This would behave as if at the end of the frame, the layer was closed and reopened, while keeping the same state as the original one. See an [analysis of alternatives considered here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.jz3qy4ebxhpr).

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
[By design](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-reset), calling `ctx.reset()` resets the whole canvas and brings it back to its original default state. This includes clearing the context's drawing state stack. Therefore, calling `ctx.reset()` after calls to `ctx.beginLayer()` must discard all pending layers. As described in the [Unclosed Layers section](#unclosed-layers), doing `ctx.beginLayer(); ctx.reset(); ctx.endLayer();` is malformed and throws an exception since `endLayer()` has no matching `beginLayer()` (it was discarded by `reset()`). 

### Call to `ctx.clearRect()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#drawing-rectangles-to-the-bitmap) `ctx.clearRect` behaves like `crx.fillRect`, with the difference being that it paints with transparent black instead of the current fill style. Therefore, calling `ctx.clearRect()` inside a layer writes transparent black to the pixels in that layer, not directly in the parent canvas or layer.

### Reading canvas content with unclosed layers
APIs like `ctx.getImageData()` or `ctx.drawImage(canvas)` effectively render a canvas frame. As described in the [Unclosed layers section](#unclosed-layers), any frame rendered while layers are active has the same effect as closing the layers, rendering the frame and re-opening the layers with an empty content but keeping their original layer rendering states.

### Call to `ctx.putImageData()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#pixel-manipulation), `putImageData()` writes pixels to the canvas wholesale, bypassing globalAlpha, shadow attributes and globalCompositeOperation. To be consistent with this, `putImageData()` must also bypass layers and write directly to the canvas underneath, or else, the pixels written would be affected by the layer's filter, blending or compositing. As described in the [Unclosed layers section](#unclosed-layers), calling `ctx.putImageData()` while unclosed layers exists has the same effects as closing the layers, calling `crx.putImageData()` and re-opening the layers with an empty content but keeping their original layer rendering states.

### Call to `ctx.drawImage()` inside layer
[By design](https://html.spec.whatwg.org/multipage/canvas.html#drawing-images), `drawImage()` is affected by globalAlpha, attributes and globalCompositeOperation. To be consistent, calling `drawImage()` inside a layer writes the image to that layer, which will in turn be filtered/blended/composited to the parent.

### Interaction with the current default path
When drawing paths, only the calls that draw pixels (functions in the [CanvasDrawPath interface](https://html.spec.whatwg.org/multipage/canvas.html#canvasdrawpath)) are impacted by layers. The [*current default path* not being part of the drawing state](https://html.spec.whatwg.org/multipage/canvas.html#drawing-paths-to-the-canvas), it's unaffected by the opening and closing of layers. Therefore, this code:
```js
  ctx.beginLayer({filter: "gaussianBlur", stdDeviation: 2});
  ctx.beginPath();
  ctx.rect(40, 40, 75, 50);
  ctx.stroke();
  ctx.endLayer();
```

is equivalent to:
```js
  ctx.beginPath();
  ctx.rect(40, 40, 75, 50);
  ctx.beginLayer({filter: "gaussianBlur", stdDeviation: 2});
  ctx.stroke();
  ctx.endLayer();
```

### Interaction with `ctx.filter = ...;`
Some Canvas2D implementations (Chrome and Firefox) shipped a feature where filters can be specified on the context directly, by doing `ctx.filter = <some filter>`. For those implementations, specifying a filter on both the context and the layer nests the two filters one into another. For instance,
```
ctx.filter = new CanvasFilter(my_filter1);
ctx.beginLayer(my_filter2);
```
is the same as:
```
ctx.filter = 'none';
ctx.beginLayer([my_filter2, my_filter1]);
```

See [here for an analysis of the alternatives considered](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.6u3unyd2kkpo).

## Alternatives considered

A full analysis of all considered alternatives can be found in [this document](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#)

## References

Some examples of the same idea outside Canvas.
- [*SaveLayer*](https://api.flutter.dev/flutter/dart-ui/Canvas/saveLayer.html) method in Flutter at Google.
- [*BeginTransparencyLayer*](https://developer.apple.com/documentation/coregraphics/cgcontext/1456011-begintransparencylayer) method in Core Graphics at Apple.
- [*SaveLayer*](https://api.skia.org/classSkCanvas.html) method in Skia.
