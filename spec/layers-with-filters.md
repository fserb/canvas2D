# Layers with filter parameter

**Status**: explainer.

## Goals
Extend the [canvas 2d layer proposal](https://github.com/fserb/canvas2D/blob/master/spec/layers.md) to support filter as a layer parameter.

## Rationale

The main purpose of the layer API is to apply effects like transparency or filters to a group of draw calls as a whole without having to use a temporary canvas. The only way to apply these effects right now is to set them as global rendering state in the context. Setting a filter at the context level has a cost however. When drawing a path or an image with a context-level filter, implementations need to implicitly create layer, as if the draw call was wrapped between `beginLayer()` and `endLayer()` calls. Thus, layers and filters go hand in hand: using filters always requires an implicit or explicit layer.

Developers should therefore avoid setting a context-level filter and use it for multiple independent draw calls. For instance, the following would be inefficient because each draw call would create individual layers:
```js
// Draw a sepia checkerboard:
ctx.filter = 'sepia()';
ctx.fillStyle = 'grey';
for (let x = 0; x < 4; ++x) {
  for (let y = 0; y < 8; ++y) {
    ctx.fillRect((x * 2 + y % 2) * 10, y * 10, 10, 10);
  }
}
```

The correct way to write this code would be to wrap the whole thing in a single layer:
```js
// Draw a sepia checkerboard:
ctx.filter = 'sepia()';
ctx.fillStyle = 'grey';
ctx.beginLayer();
for (let x = 0; x < 4; ++x) {
  for (let y = 0; y < 8; ++y) {
    ctx.fillRect((x * 2 + y % 2) * 10, y * 10, 10, 10);
  }
}
ctx.endLayer();
```

With this in mind, it's a good practice to always clear the context filter after the layer, to avoid accidentally using it for more draw calls later:
```js
ctx.save();
ctx.filter = 'sepia()';
ctx.beginLayer();
// ...
ctx.endLayer();
ctx.restore();
```
or:
```js
ctx.filter = 'sepia()';
ctx.beginLayer();
// ...
ctx.endLayer();
ctx.filter = 'none';
```

The first approach is quite verbose and it's inefficient because `save()` and `restore()` save a lot more states than is necessary. The second approach require manual state and scope management, which is error prone. A better solution would be to have the filter be a property of the layer itself:
```js
ctx.beginLayer({filter: 'sepia()'});
// ...
ctx.endLayer();
```


## Proposal

```webidl
typedef record<DOMString, any> CanvasFilterPrimitive;
typedef (DOMString or
         CanvasFilterPrimitive or
         sequence<CanvasFilterPrimitive>) CanvasFilterInput;

dictionary BeginLayerOptions {
  CanvasFilterInput? filter;
};

interface mixin CanvasLayers {
  undefined beginLayer(optional BeginLayerOptions options = {});
  undefined endLayer();
};
```

With this proposal, `beginLayer()` can be called with an optional filter as argument, in which case the layer's resulting texture will be rendered in the canvas using that filter. Filters are specified as a CSS filter string or as CanvasFilterInput objects ([originally proposed here](https://github.com/whatwg/html/issues/5621)) which describes SVG filters with a JavaScript syntax. [See below](#possible-api-improvements) for possible future improvements, [and here](https://docs.google.com/document/d/1jeLn8TbCYVuFA9soUGTJnRjFqLkqDmhJElmdW3w_O4Q/edit#heading=h.52ab2yqq661g) for a full analysis of alternatives considered.

## Example usage

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.globalAlpha = 0.5; 

ctx.beginLayer({filter: 'blur(4px)'});

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

Filters can be specified as a `CanvasFilterPrimitive` object:
```js
ctx.beginLayer({filter: {name: 'gaussianBlur', stdDeviation: 4}});
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
typedef (DOMString or
         CanvasFilterPrimitive or
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
ctx1.beginLayer({filter: reusableFilter});
ctx2.beginLayer({filter: reusableFilter});
```

This API would be easily extendable, allowing for more arguments to be added to `beginLayer` if we ever need to. For instance, beginLayer could accept parameters like `alpha`, `compositeOperation` or `antialiasing`:
```js
ctx.beginLayer({filter: [{name: 'gaussianBlur', stdDeviation: 2},
                         {name: 'dropShadow', dx: 5, dy: 5}],
                compositeOp: "source-over",
                antialiasing: "disabled"});
```

## Corner cases

### Interaction with `ctx.filter = ...;`
If a context-level filter and a layer filter are both specified, the context-level filter apply on the result of the layer filter. Thus, the following two snippets produce the same results:

```js
ctx.filter = 'drop-shadow(10px 10px 0px blue)';
ctx.beginLayer({filter: 'drop-shadow(5px 5px 0px red)'});
ctx.fillRect(20, 60, 100, 20);
ctx.fillRect(60, 20, 20, 100);
ctx.endLayer();
```

```js
ctx.filter = 'drop-shadow(10px 10px 0px blue)';
ctx.beginLayer();
ctx.filter = 'drop-shadow(5px 5px 0px red)';
ctx.beginLayer();
ctx.fillRect(20, 60, 100, 20);
ctx.fillRect(60, 20, 20, 100);
ctx.endLayer();
ctx.endLayer();
```

### Filter dimensions
In SVG, filters can have their own dimensions, specified using the `width`, `height`, `x`, and `y` properties. Canvas layers can do the same things using clipping.

For instance, the following two snippets produce the same results:
```html
<svg xmlns="http://www.w3.org/2000/svg"
     width="70" height="70" viewBox="0 0 70 70"
     color-interpolation-filters="sRGB">
  <filter id="blur" y="20" x="20" width="50" height="30" filterUnits="userSpaceOnUse">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
  </filter>
  <rect x="10" y="10" width="50" height="50" fill="magenta" filter="url(#blur)"/>
</svg>
```

```html
<script>
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const region = new Path2D();
  region.rect(20, 20, 50, 30);
  ctx.clip(region);
  ctx.beginLayer({filter: {name: "gaussianBlur", stdDeviation: 10}});
  ctx.fillStyle = 'magenta';
  ctx.fillRect(10, 10, 50, 50);
  ctx.endLayer();
</script>
```