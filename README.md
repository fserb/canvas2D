Update Canvas 2D API
====================

This repo contains new, current and old proposals for updates in the [Canvas 2D API](https://html.spec.whatwg.org/multipage/canvas.html), following a set of [rationales](rationale.md).

[Explainer video](https://www.youtube.com/watch?v=dfOKFSDG7IM)

Already landed
------------


About to launch
------------

- [**Canvas context loss**](spec/context-loss.md). Allow canvas to be discarded and re-drawn by demand.

- [**willReadFrequently**](spec/will-read-frequently.md). context creation attribute.

- [**Color input**](spec/color-input.md). support for new color input on Canvas.

- [**Text modifiers**](spec/text-modifiers.md). CSS text/font properties on Canvas.

- [**Reset function**](spec/reset.md). Draw primitive.

- [**RoundRect**](spec/roundrect.md). Draw primitive.

- [**Perspective transforms**](spec/perspective-transforms.md). Allow for perspective transforms Canvas 2D rendering. Support 4x4 transform matrices.

- [**Conic Gradient**](spec/conic-gradient.md). Draw primitive.

- [**Modern filters**](spec/filters.md). Support composited filters, create a filter object that can be updated, and support more SVG-like filters.

In development
------------

- [**Layers**](spec/layers.md). Support layers in canvas, that will be drawn in one, allowing effects only possible with auxiliary canvases.

Future ideas
------------

- [**Batch drawImage**](spec/batch-drawimage.md). Support for multiple images being drawn within a single API call.

- [**Recorded pictures**](spec/recording.md). Create a record object that receives all the commands from a Canvas2D and can be replayed multiple times.

- [**Conic curves**](spec/conic-curve-to.md). Draw primitive.

- **Batch text rendering**.

- **Text blob**.

- **Path2D Inspection**. Allow inspection of Path2D objects, that are currently opaque.

- **Element as a source for drawImage**.
