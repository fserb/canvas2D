Update Canvas 2D API
====================

This repo contains proposal for an updated version of the [Canvas 2D API](https://html.spec.whatwg.org/multipage/canvas.html), following a set of [rationales](rationale.md).

Feature list
------------

- [**Batch drawImage**](spec/batch-drawimage.md). Support for multiple images being drawn within a single API call.

- [**Canvas context loss**](spec/context-loss.md). Allow canvas to be discarded and re-drawn by demand.

- [**willReadFrequently**](spec/will-read-frequently.md). context creation attribute.

- [**Array color input**](spec/array-color-input.md). support for new color input on Canvas.

- [**Text modifiers**](spec/text-modifiers.md). CSS text/font properties on Canvas.

- [**Clear function**](spec/clear.md). Draw primitive.

- [**RoundRect**](spec/roundrect.md). Draw primitive.

- [**Conic curves**](spec/conic-curve-to.md). Draw primitive.

- [**Perspective transforms**](spec/perspective-transforms.md). Allow for perspective transforms Canvas 2D rendering. Support 4x4 transform matrices.

- [**Conic Gradient**](spec/conic-gradient.md). Draw primitive.

- [**Modern filters**](spec/filters.md). Support composited filters, create a filter object that can be updated, and support more SVG-like filters.


Future ideas
------------

- [**Recorded pictures**](spec/recording.md). Create a record object that receives all the commands from a Canvas2D and can be replayed multiple times.

- **Batch text rendering**.

- **Text blob**.

- **Path2D Inspection**. Allow inspection of Path2D objects, that are currently opaque.

- **Element as a source for drawImage**.
