Update Canvas 2D API
====================

This repo contains new, current and old proposals for the [Canvas 2D API](https://html.spec.whatwg.org/multipage/canvas.html), following a set of [rationales](rationale.md).

[Explainer video](https://www.youtube.com/watch?v=dfOKFSDG7IM)

In active development
---------------------

- [**Layers**](spec/layers.md). Support layers in canvas, that will be drawn in one, allowing effects only possible with auxiliary canvases.

- [**WebGPU Access**](spec/webgpu.md). Switch contexts between Canvas2D and WebGPU.

- [**Enhanced Text Metrics**](spec/enhanced-textmetrics.md). Extend measureText to support DOM-provided APIs, like selection rect and more.

- [**Mesh2D**](spec/mesh2d.md). Draw a large number of texture-mapped triangles efficiently.



Launched
--------

Those proposals have already been incorporated on the [WhatWG spec](https://html.spec.whatwg.org/multipage/canvas.html) and may be in different stages of implementation on browsers.

- [**Canvas context loss**](spec/context-loss.md). Allow canvas to be discarded and re-drawn by demand.

- [**willReadFrequently**](spec/will-read-frequently.md). context creation attribute.

- [**Text modifiers**](spec/text-modifiers.md). CSS text/font properties on Canvas.

- [**Reset function**](spec/reset.md). Draw primitive.

- [**RoundRect**](spec/roundrect.md). Draw primitive.

- [**Conic Gradient**](spec/conic-gradient.md). Draw primitive.



Parked / Future ideas
---------------------

- [**Perspective transforms**](spec/perspective-transforms.md). Allow for perspective transforms Canvas 2D rendering. Support 4x4 transform matrices.

- [**Recorded pictures**](spec/recording.md). Create a record object that receives all the commands from a Canvas2D and can be replayed multiple times.

- [**Conic curves**](spec/conic-curve-to.md). Draw primitive.

- **Batch text rendering**.

- **Text blob**.

- **Path2D Inspection**. Allow inspection of Path2D objects, that are currently opaque.

- **Element as a source for drawImage**.

- [**Display list object**](spec/display-list-object.md). Format and data structure for retained mode drawings, making Canvas apps faster, more accessible and indexable.

- [**WebGPU Shaders**](spec/shaders.md). Allow for WebGPU shaders to be used as Canvas2D layers filters.



Dropped ideas
-------------

- [**Color input**](spec/color-input.md). support for new color input on Canvas.

- [**Batch drawImage**](spec/batch-drawimage.md). Support for multiple images being drawn within a single API call.

- [**Modern filters**](spec/filters.md). Support composited filters, create a filter object that can be updated, and support more SVG-like filters. Superseded by [layers](spec/layers.md).
