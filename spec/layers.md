clear function
==============
**Status**: explainer.

Provide a `beginLayer()` and `endLayer()` functions that create and close layers for Canvas.


Rationale
---------

Currently, the only way to draw a series of drawing calls at the same time, while applying the same sort of effects (shadows, blur, alpha, filters, compositing) to all of the drawn objects, without having these effects being applied one to one to this object, is by using an auxiliary canvas and then, drawing that auxiliary canvas to the canvas.
This proposal adds an alternative to that by creating a layer that then will be drawn in one go when the layer ends. The idea of this addition is to have the same behavior as using an external canvas would do, without the issues of having to create an external canvas.


Proposal
--------

```webidl
interface mixin CanvasState {
  // extending original
  undefined beginLayer();
  undefined endLayer();
};
```
The rendering state used for the layer rendering will use the current state of the canvas. 

`beginLayer()` sets the start point of the layer, it also captures the current state of the canvas (see list below) that will be used when rendering the layer. At the begin of the layer, the rendering state (list below) will be reset to the defaults, so the drawing operations in the inside of the layer, will behave as an auxiliary canvas would do. The attributes of the canvas state that we care about in `beginLayer()` are:
- globalAlpha
- globalCompositeOperation
- shadowOffsetX
- shadowOffsetY
- shadowColor
- shadowBlur
- filter
- ctm (current transformation matrix)
- current clipping region


`endLayer()` sets the end point of the layer. At that moment the layer itself will be drawn as one single object into the canvas. Once the layer ends, the rendering state will be the same as it is at the point of the `beginLayer()`, following the same pattern as `save()` and `restore()` do.

These methods are nesteable, so layers can be created and drawn within layers.

If there is a dangling `beginLayer()` without `endLayer()`, those operations will not be drawn.

For the interactions with `save()` and `restore()`, a `save()` without `restore()` (or single `restore()` without `save()`) between a pair of `beginLayer()` and `endLayer()` will be discarded.

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
