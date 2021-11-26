Layers
======
**Status**: explainer.

Provide a `beginLayer()` and `endLayer()` functions that create and close layers for Canvas.


Rationale
---------

To apply a filter or compositing to a set of draw operations (as opposed
to a single one), the onyl current solution is draw to a temporary canvas
and then draw the temporary canvas into the final destination.

This proposal adds an alternative to that by creating a layer that then will be drawn as a single unit. This would be equivalent to having a
temporary canvas, except not only in a much more friendly way, but with the added benefit that the browser can take care of deciding what's the best dimension of the temporary canvas, given the current transform/clip.


Proposal
--------

```webidl
interface mixin CanvasState {
  // extending original
  undefined beginLayer();
  undefined endLayer();
};
```

`beginLayer()` and `endLayer()` will work the same way as the pair `save()` and `restore()` do with the full current state of the canvas. `beginLayer()` will capture and store the full current state of the canvas, and `endLayer()` will restore that state.

The layer will be rendered with the full current state of the canvas that was captured at the moment of `beginLayer()`.

There is a subset of the attributes of the state of the canvas that we will call in this document **layer rendering attributes**, those are:
- globalAlpha
- globalCompositeOperation
- shadowOffsetX
- shadowOffsetY
- shadowColor
- shadowBlur
- filter
- current transformation matrix (CTM)
- current clipping region

`beginLayer()` sets the start point of the layer. At the beginning of the layer, the **layer rendering attributes** will be set to their defaults, i.e., the drawing operations inside the layer behave as if we were starting a new canvas.

`endLayer()` sets the end point of the layer. At that moment the layer itself will be drawn as one single object into the canvas. As mentioned before, this rendering of the layer will be done with the full state of the canvas that was captured in `beginLayer()`.

`beginLayer()` and `endLayer()` are nesteable, so layers can be created and drawn within layers.

An `endLayer()` without a `beginLayer()` is considered a no-op.

At the end of the frame, a layer that was not closed will be rasterized, and in the next frame the layer starts empty and can still be used (and closed). This would behave as if at the end of the frame the layer was closed, and reopened - while keeping the same state as the original one.

Attention must be paid to the interaction between layers and `save()`/`restore()`. A `save()` without `restore()` (or a `restore()` without `save()`) between a pair of `beginLayer()` and `endLayer()` are always discarded. I.e., save and restore never cross the layer barrier.

As an implementation detail, it's possible to implement layers on top of the current Canvas state stack, as long as attention is paid to not allow restoring something that was saved outside the layer, and that endlayer returns always at the same nest level.



Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.globalAlpha = 0.5; 
ctx.beginLayer();
ctx.fillStyle = 'rgba(225,0,0,1)';
ctx.fillRect(50,50,75,50);
ctx.fillStyle = 'rgba(0,255,0,1)';
ctx.fillRect(70,70,75,50);
ctx.endLayer();
```

Would produce the same outcome as,


```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const canvas2 = document.createElement('canvas');
const ctx2 = canvas.getContext('2d');
ctx2.fillStyle = 'rgba(225,0,0,1)';
ctx2.fillRect(50,50,75,50);
ctx2.fillStyle = 'rgba(0,255,0,1)';
ctx2.fillRect(70,70,75,50);

ctx.globalAlpha = 0.5; 
ctx.drawImage(canvas2,0,0);
```

Alternatives considered
-----------------------

- Adding the properties of the layer (the effects from the current canvas state) as parameters in `beginLayer()`. We opted to not add this as it would create a new semantic for the 2D API.
- Naming the methods `saveLayer()` and `restoreLayer()`. We opted not to do this because we wanted to make more explicit that the user is making a new layer and that it would be used to render.
- Using `restore()` as an alternative of `endLayer()`. We opted not to do this as it could make the code less explicit.


References
----------

Some examples of the same idea outside Canvas.
- [*SaveLayer*](https://api.flutter.dev/flutter/dart-ui/Canvas/saveLayer.html) method in Flutter at Google.
- [*BeginTransparencyLayer*](https://developer.apple.com/documentation/coregraphics/cgcontext/1456011-begintransparencylayer) method in Core Graphics at Apple.
- [*SaveLayer*](https://api.skia.org/classSkCanvas.html) method in Skia.
