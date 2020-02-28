Recorded Pictures
=================
**Status**: explainer.

This feature allows users to batch multiple 2D commands in a single object that
can be draw ("replayed") multiple times on the curent Canvas.

This feature enables big performance improvements across canvas usages, as it
removes a lot of Javascript bottlenecks.


Proposal
--------

```webidl
interface mixin CanvasRecorder {
  Canvas2DRecording createCanvasRecording();
  void playback(Canvas2DRecording rec);
};

interface Canvas2DRecording {
  readonly attribute HTMLCanvasElement canvas;
};

Canvas2DRecording includes CanvasState;
Canvas2DRecording includes CanvasTransform;
Canvas2DRecording includes CanvasCompositing;
Canvas2DRecording includes CanvasImageSmoothing;
Canvas2DRecording includes CanvasFillStrokeStyles;
Canvas2DRecording includes CanvasShadowStyles;
Canvas2DRecording includes CanvasFilters;
Canvas2DRecording includes CanvasRect;
Canvas2DRecording includes CanvasDrawPath;
Canvas2DRecording includes CanvasUserInterface;
Canvas2DRecording includes CanvasText;
Canvas2DRecording includes CanvasDrawImage;
Canvas2DRecording includes CanvasImageData;
Canvas2DRecording includes CanvasPathDrawingStyles;
Canvas2DRecording includes CanvasTextDrawingStyles;
Canvas2DRecording includes CanvasPath;

CanvasRenderingContext2D includes CanvasRecorder;
OffscreenCanvasRenderingContext2D includes CanvasRecorder;
```
`Canvas2DRecording` are canvas-independent (they can replayed on any canvas).
They are also transferable.

All rendering state is repeated from the call time.

### Open issues and questions
- do the recordings need to be Canvas dependent?
- do they need to be frozen?
- can they be transfered?
- should they be on the global namespace? create vs new?


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const rec = ctx.createCanvasRecording();

rec.fillStyle = "red";
rec.fillRect(0, 0, 10, 10);

ctx.playback(rec);
```

Alternatives considered
-----------------------

- change canvas state to a "now recording" mode.
- add a `freeze` or `done` method to `Canvas2DRecording`


References
----------
