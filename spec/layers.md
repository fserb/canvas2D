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

`beginLayer()` sets the start point of the layer, it will also specify the effects (shadows, blur, alpha, filters, compositing) that will be used to draw the layer.
`endLayer()` sets the end point of the layer. At that moment the layer itself will be drawn as one single object into the canvas. When the layer ends, the 


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.beingLayer();
ctx.globalAlpha = 0.5; 
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

None.


References
----------

None.
