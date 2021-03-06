clear function
==============
**Status**: explainer.

Provide a `reset()` function that resets the state of the Canvas.


Rationale
---------

Currently, there's no canonical way of clearing a Canvas, some of the used
ways are actually wrong, and users are overall [confused](https://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing) about it. Current ways of clearing a canvas:

1. `ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);` is wrong, as it doesn't reset the path.
2. `ctx.fillStyle = "white"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);` can lead to performance issues.
3. `ctx.canvas.width = ctx.canvas.width` clears the canvas, but also resets style. Very opaque.
4. `ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.beginPath();` is the only good way of doing so.

This is a small quality of life improvement.


Proposal
--------

```webidl
interface CanvasRenderingContext2D {
  // extending original
  void reset();
};

interface OffscreenCanvasRenderingContext2D {
  // extending original
  void reset();
};
```

`reset()` clears the backing buffer to transparent black, the current path and sets the transformation
stack empty.

### Open issues and questions

- support a optional color parameter


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.reset();
```

Alternatives considered
-----------------------

None.


References
----------

None.
