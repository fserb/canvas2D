clear function
==============
**Status**: explainer.

Provide a `beginLayer()` and `endLayer()` functions that create and close layers for Canvas.


Rationale
---------

Currently, the only way to draw a series of drawing calls at the same time, while applying the same sort of effects (shadows, blur, alpha, filters, compositing) to all of the drawn objects, without having these effects being applied one to one to this object, is by using an auxiliary canvas and then, drawing that auxiliary canvas to the canvas.
This proposal adds an alternative to that (the same way that Fullter in Google and Core Graphics at Apple do) by creating a layer that then will be drawn in one go when the layer ends.


Proposal
--------

```webidl
interface CanvasRenderingContext2D {
  // extending original
  void beginLayer();
  void endLayer();
};

interface OffscreenCanvasRenderingContext2D {
  // extending original
  void beginLayer();
  void endLayer();
};
```
The rendering of the layer will use the current state of the canvas, and will reset these effects to the defaults at the end of the layer. The effects that will be used are:
- globalAlpha
- globalCompositeOperation
- shadowOffsetX
- shadowOffsetY
- shadowColor
- shadowBlur
- filter

`beginLayer()` sets the start point of the layer, it also captures the current state of the canvas (see list above) that will be used when rendering the layer.
`endLayer()` sets the end point of the layer. At that moment the layer itself will be drawn as one single object into the canvas. When the layer ends, we reset all the effects used in the drawing of the layer at the end of it (see list above).


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.globalAlpha = 0.5; 
ctx.beingLayer();
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


References
----------

Some examples of the same idea outside Canvas.
- [*SaveLayer*](https://api.flutter.dev/flutter/dart-ui/Canvas/saveLayer.html) method in Flutter at Google.
- [*BeginTransparencyLayer*](https://developer.apple.com/documentation/coregraphics/cgcontext/1456011-begintransparencylayer) method in Core Graphics at Apple.