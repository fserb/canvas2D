# Layers

**Status**: explainer.

## Goals
Provide a simple and high-performance canvas 2D layer API that can be used to group multiple draw calls on which blending, compositing, shadow or filters can be applied as a whole.

## Non-goals
Provide a means for recording and replaying draw commands multiple times. This is an orthogonal concern with a completely separate set of costs and benefits. It has been previously suggested in the [Recorded Pictures](https://github.com/fserb/canvas2D/blob/master/spec/recording.md) proposal and should be pursued separately.

## Rationale

The only current solution for applying a filter, shadow, compositing or transparency to a set of draw operations (as opposed to each individual ones) is to draw to a temporary canvas and then draw the temporary canvas into the final destination. This option is complex to use, not easily discovered by web developers and inefficient.

This proposal adds a simple and efficient API for creating layers to be drawn as a single unit. Filters, blending and compositing operations can be applied when drawing the layer's final content onto the destination. This is more user friendly than using a temporary canvas and allows the browser to implement optimizations, like:
 - Automatically decide what's the best dimension of the temporary image buffer. The browser will produce the drawing equivalent to having a temporary canvas with the minimum size required, given the current transform/clip.
 - Improve performance and memory usage by detecting whether the layers can be drawn in-place to the canvas, without the need for a temporary texture.
 - Allow the browser to render layer content pixel-aligned with underlying canvas, therefore removing the need for resampling, boosting performance and image quality.

## Proposal

```webidl
interface mixin CanvasLayers {
  undefined beginLayer();
  undefined endLayer();
};
```

Layers are created by calling `beginLayer()` on the context and terminated by calling `endLayer()`. The layer API does not use a separate layer context: any draw calls performed on the main context between calls to `beginLayer()` and `endLayer()` are considered part of that layer. `beginLayer()` and `endLayer()` are nestable, so layers can be created and drawn within layers. The context must therefore keep a stack of active layers and apply draw calls on the layer at the top of this stack. [See here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.35wlbbo9qx59) for an analysis of different API designs considered.

Layers behave as if all the draw calls they contain are rendered on a separate texture. That texture is then rendered in the canvas (or the parent layer) with the drawing state of the context as it was when `beginLayer()` was called (i.e. globalAlpha, globalCompositeOperation, shadow and filter are applied on the layer's result). As before, image smoothing only applies to drawImage calls, not on layer result textures ([more on this below](#image-smoothing)).

`beginLayer()` and `endLayer()` save and restore the full current state of the context, similarly to `save()` and `restore()`. `beginLayer()`/`endLayer()` and `save()`/`restore()` must therefore operate on the same stack, which must keep track of both the layers and rendering state nesting.

A subset of the rendering state we'll call **layer rendering attributes** are applied on the layer's resulting texture. To make sure that these are not applied twice (once on the draw calls in the layer and once on the layer's result), these attributes must be reset to their default values at the beginning of the layer. `endLayer()` will restore them to the value they had when `beginLayer()` was called. This is aligned with the expectations of web developers currently using a temporary canvas to simulate layers: the temporary canvas doesn't inherit any rendering states from the destination canvas. The **layer rendering attributes** are:
- current transformation matrix
- current clipping region
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
ctx.filter = 'blur(4px)';

ctx.beginLayer();

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

## Corner cases

### getTransform and setTransform inside layers
There are two types of transform APIs in the canvas: relative transformations (like `translate()`, `rotate()`, etc.) and absolute transformations (`getTransform()` and `setTransform()`). Relative transformations are multiplied on the current matrix, while absolute transformations replace the whole matrix with a new one.

Relative transforms are well behaved inside layers. Transforms inside the layer simply multiplies over the parent transform. Transforms in the parent correctly transform the whole layer, as if a temporary canvas was used to draw the layer content. Absolute transforms however are more tricky. They could be implemented two different ways: they could either operate on the global matrix, or they could operate on a layer-local matrix, isolated from the parent transform.

Having `setTransform()` operate on the global matrix would break the layer encapsulation. Parent transforms would not apply to the layer as a whole since content drawn beyond the point where `setTransform()` is called would not be affected by that parent transform. This would make layers behave differently than if a temporary canvas was used to simulate the layer.

Moreover, calling `setTransform()` inside a layer would override any transform set in the parent. The parent texture would be correctly restored when calling `endLayer()`, but there are still a problem if the parent transformation was a non-invertible matrices. In the normal case, non-invertible matrices effectively disables all draw calls:
```js
ctx.scale(0, 0);
ctx.fillRect(0, 0, 10, 10);  // Draws nothing.
```

This should apply to layers too:
```js
ctx.scale(0, 0);
ctx.beginLayer();
  ctx.fillRect(0, 0, 10, 10);
ctx.endLayer()  // Draws nothing.
```

If `setTransform()` was called inside the layer though, it's unclear what would happen if it restored the global matrix:
```js
ctx.scale(0, 0);  // Non-invertible matrix.
ctx.beginLayer();  // The whole layer is non-rasterizable.
  ctx.fillRect(0, 0, 10, 10);  // Can't be drawn, the transform is still non-invertible.
  ctx.setTransform(1, 0, 0, 1, 0, 0);  // Restores the global matrix to identity.
  ctx.fillRect(0, 0, 10, 10);  // Unclear what happens here.
ctx.endLayer();
```

The issues described above are avoided if we make `setTransform()` operate on a layer-local matrix. Layers would have their own matrix, initialized to identity when entering the layer. Get `getTransform()` and `setTransform()` would operate on that matrix. When closing the layer, the parent transform would apply to the layer as a whole.

```js
ctx.scale(0, 0);  // Non-invertible matrix.
ctx.beginLayer();  // The whole layer is non-rasterizable.
  ctx.fillRect(0, 0, 10, 10);  // Can be drawn in the layer (but implementations could optimize away if wanted).
  ctx.setTransform(1, 0, 0, 1, 0, 0);  // No-op, the layer transform is already identity.
  ctx.fillRect(0, 0, 10, 10);  // Same: can be drawn.
ctx.endLayer();  // Draws nothing to the top level output bitmap.
```

### Transformed layers
The [above section on getTransform and setTransform](#gettransform-and-settransform-inside-layers) explains why we need layers to have their own transformation matrix. This however creates a new problem. Consider for instance:

```js
ctx.translate(100, 100);  // Set a transform in the global scope.
ctx.rotate(0.2 * Math.PI);
ctx.beginLayer();  // Opens a new layer. The transform in the layer is now identity.
ctx.rotate(0.8 * Math.PI);  // Set a transform inside the layer.
ctx.fillRect(10, 10, 100, 100);  // Draw a rect rotated by 0.8π.
ctx.endLayer();  // Draws the layer rotated by 0.2π.
```

If the layer's output bitmap was transformed by the parent's transform, the resulting resampling would lower the performance and picture quality for every nested layer. In the above example, the shape would be first rasterized at an angle in the layer and the layer would then be rotated and resampled into the final raster. This resampling is unfortunate: since the rect was rotated by a full $π$, it's axis aligned and could have been drawn with exact pixel values.

The solution is for implementations to transform the coordinate system, not the output bitmaps. In the above example, instead of saying that we draw a rect at position $[10, 10]$ in a layer, rotate the rect by $0.8π$, close the layer, then rotate the layer by $0.2π$, we would say that we rotate the coordinate system by $-0.2π$, open a layer, rotate the coordinate system by $-0.8π$ and finally draw the rect at position $[10, 10]$ in this transformed coordinate system. With the latter interpretation, we are drawing the rect at it's final position in the final raster, therefore removing the need to resample layer outputs.

### Image smoothing
`imageSmoothingEnabled` and `imageSmoothingQuality`, as their names suggest, are properties controlling how images are drawn by `drawImage()`. They do not apply to layer's outputs. As explained in the [Transformed layers](#transformed-layers) section, shapes drawn inside layers are always drawn at the position they'll have in the final raster, meaning that layer's output bitmaps are never resampled when they are drawn to their parents. Thus, there is no need for applying an image smoothing filter.

If smoothing was to be applied on every layer output, the image quality would degrade on every layer nesting level we add. [See here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.qo8c65b01d75) for an example of the impact of either option on image quality.

### Transformed shadows and filters
Shadows normally ignore the current transform, because when composing a scene by drawing multiple shapes and using transforms to position these drawings, we still want the shadow to be applied the same way for all drawn elements, as if a single point source illuminates the scene. Filters behave similarly because they can be used to apply a blur or cast a shadow, which should be applied uniformly across the scene.

However, if [as described above](#gettransform-and-settransform-inside-layers) we consider layers as having their own layer-local transformation matrix and we have the parent transform apply to the whole layer, it follows that shadows inside a layer should be affected by the parent transform. Consider the following example:

```js
ctx.scale(2, 2);  // Scales the whole layer, fillRect and shadow included.
ctx.beginLayer();
ctx.scale(3, 3);  // Applies to the fillRect, but not the shadow.
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;
ctx.shadowColor = 'red';
ctx.fillRect(0, 0, 10, 10);
ctx.endLayer();
```

Here, the shadow ignores the transform inside the layer. The transform in the parent however scales the whole layer, meaning that the shadow will effectively be drawn with an offset of $5 * 2 = 10$.

The section on [transformed layers](#transformed-layers) states that shapes drawn in a layer must be drawn at the final position they'll have in the final raster to avoid layer output resampling. This means that to draw shadows inside a layer, implementation must keep track of two matrices:
- The layer transformation matrix, which corresponds to the transformation local to the current layer.
- The parents transformation matrix, which is the multiplication of the transforms of all the ancestors of the current layer.

When drawing shadowed shapes, implementation should behave as if they draw the shape using the layer transformation matrix, apply the shadow, then transform the resulting bitmap by the parents transformation matrix before drawing the result in the final canvas raster.

### Shadowed or filtered current default path
[According to the specification](https://html.spec.whatwg.org/multipage/canvas.html#building-paths), paths must be transformed before they are added to the **current default path**. Thus, the **current default path** is always already transformed and [must not be transformed again when drawn](https://html.spec.whatwg.org/multipage/canvas.html#intended-path), or else the transformation would be applied twice.

As described in the [transformed shadows and filters](#transformed-shadows-and-filters) section, shadows and filters shouldn't be affected by the transform inside a layer, but should be transformed by the layer's ancestors' transforms. Since **current default path** stores paths already transformed, applying the ancestors' transform would be applying these transforms twice. Thus, to draw a shadow or a filter when using the **current default path**, implementation must first undo the transformation matrix of the layer's ancestors by transforming the **current default path** with the inverse of the parents transformation matrix, drawing the path, applying the shadow or filter, and reapply the parents transformation matrix.

### Current default path and layer boundaries
When drawing paths, only the calls that draw pixels (functions in the [CanvasDrawPath interface](https://html.spec.whatwg.org/multipage/canvas.html#canvasdrawpath)) are impacted by layers. The [*current default path* not being part of the drawing state](https://html.spec.whatwg.org/multipage/canvas.html#drawing-paths-to-the-canvas), it's unaffected by the opening and closing of layers. Therefore, these three snippets produce the same result:
```js
ctx.beginPath();
ctx.rect(40, 40, 75, 50);
ctx.stroke();
```

```js
ctx.beginPath();
ctx.rect(40, 40, 75, 50);

ctx.beginLayer();
ctx.stroke();
ctx.endLayer();
```

```js
ctx.beginLayer();
ctx.beginPath();
ctx.rect(40, 40, 75, 50);
ctx.endLayer();

ctx.stroke();
```

### Unclosed layers
Layers only gets filtered and composited to their parent bitmap when they are closed. Accessing the canvas bitmap pixels while a layer is opened is a malformed operation.

APIs like `putImageData()` in particular are incompatible with unclosed layers. [By design](https://html.spec.whatwg.org/multipage/canvas.html#pixel-manipulation), `putImageData()` writes pixels to the canvas wholesale, bypassing globalAlpha, shadow attributes and globalCompositeOperation. To be consistent with this, `putImageData()` must also bypass layers and write directly to the canvas underneath, or else, the pixels written would be affected by the layer's filter, blending or compositing. `putImageData()` can't however sidestep the layer and write directly to the canvas because when `endLayer()` is called, the layer content would overwrite the pixels written by `putImageData()`. For instance:
```js
ctx.beginLayer();
ctx.fillRect(0, 0, 100, 100);

// Draws `img` to the canvas:
ctx.putImageData(img, 0, 0);

// When closing the layer, the pixels drawn by `putImageData` would
// effectively get overwritten by a previous `fillRect`.
ctx.endLayer();
```

To give a clear message to web developers, and make sure web sites do not start depending on degenerate API uses, all APIs directly accessing the canvas bitmap pixels while layers are opened must throw an exception or returned a failed promise. Example APIs are:

Raises an exception:
 - `CanvasRenderingContext2D.drawImage(canvas, 0, 0);`  (reading pixels from `canvas`).
 - `CanvasRenderingContext2D.getImageData(...)`
 - `CanvasRenderingContext2D.putImageData(...)`
 - `HTMLCanvasElement.toBlob(...)`
 - `HTMLCanvasElement.toDataURL(...)`
 - `OffscreenCanvas.transferToImageBitmap()`
 - `CanvasRenderingContext2D.createPattern(canvas, ...)`  (reading pixels from `canvas`).

Returns failed promise:
 - `createImageBitmap(canvas)`  (reading pixels from `canvas`).
 - `OffscreenCanvas.convertToBlob(...)`

The canvas bitmap is also read on render opportunities, when the script ends for instance, or if it pauses on an `await` statement. Because there is no way to raise an exception in these cases, we have no other choice but present the content of the canvas regardless of unclosed layers. This already works with the `save()`/`restore()` API: the canvas can be presented even if there are pending saves and implementations have to maintain the canvas state stack alive across JavaScript task executions. To be consistent with this, pending layers must also be kept alive across tasks.

Layers are likely to be always used with [**layer rendering attributes**](#proposal) (globalAlpha, globalCompositeOperation, filter, etc.) because otherwise, drawing with a layer is no different than drawing without. If layers survive across task, we can't present them until they are closed. Presenting the layer before that would require applying the **layer rendering attributes** on the incomplete layer and again when the layer is later closed, which would not produce the same result as applying them on the whole layer at once.

Thus, when a task ends while layers are opened, implementations need to present the draw calls up to the point where where `beginLayer()` is called and hold-on to the layer content until it's later closed, at which point will be presentable in the next frame.

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
[By design](https://html.spec.whatwg.org/multipage/canvas.html#drawing-images), `drawImage()` is affected rendering states like globalAlpha, globalCompositeOperation, etc. This has to be the case when calling `drawImage()` inside a layer too. Calling `drawImage()` in a layer draws the image in that layer, with the layer's rendering state applied.

## Alternatives considered

A full analysis of all considered alternatives can be found in [this document](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#)

## References

Some examples of the same idea outside Canvas.
- [*SaveLayer*](https://api.flutter.dev/flutter/dart-ui/Canvas/saveLayer.html) method in Flutter at Google.
- [*BeginTransparencyLayer*](https://developer.apple.com/documentation/coregraphics/cgcontext/1456011-begintransparencylayer) method in Core Graphics at Apple.
- [*SaveLayer*](https://api.skia.org/classSkCanvas.html) method in Skia.
