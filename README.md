Update Canvas 2D API
====================

This repo contains proposal for an updated version of the Canvas 2D API.

Feature list
------------

- [**Batch drawImage**](spec/batch-drawimage.md). Support for multiple images being drawn within a single API call.

- [**Canvas context loss**](spec/context-loss.md). Allow canvas to be discarded and re-drawn by demand.

- [**willReadFrequently**](spec/will-read-frequently.md). context creation attribute.

- [**Array color input**](spec/array-color-input.md). support for new color input on Canvas.

- [**Text modifiers**](spec/text-modifiers.md). CSS text/font properties on Canvas.

- [**Clear**](spec/clear.md). Draw primitive.

- **Non-affine transforms**. Allow for perspective transforms Canvas 2D rendering. Support 3x3 transform matrices.

- **RoundRect**. Draw primitive.

- **New Gradients**. Draw primitive.

- **Modern filter**. Support composited filters, create a filter object that can be updated, and support more SVG-like filters.

- **Recorded pictures**. Create a record object that receives all the commands from a Canvas2D and can be replayed multiple times.

- **Path2D Inspection**. Allow inspection of Path2D objects, that are currently opaque.

- **Wide gamut**. Support for FP16 - Extended SRGB mode.


Rationale
---------

The current Canvas 2D API was originally proposed in 2013. Since then, a lot of 2D graphics APIs have appeared and changed what developers expect from a good 2D API. This proposal tries to modernize Canvas 2D API, considering current and future usage of Canvas and considering the following:

1. Canvas is the web’s direct mode rendering solution that closely matches traditional programming models. This is a particularly common need for games and full featured apps.

2. A common bottleneck for Canvas2D rendering is how many Javascript functions are needed to render a particular scene. With this in mind, adding more expressive APIs (that allow you to render the same scene with fewer commands) will result in better performance.

3. Modern 2D developers sometimes have to fallback to GL for features that are expected to be available in 2D but currently aren’t supported by Canvas 2D.

4. Modern browsers implement a rich set of rendering features that are currently unavailable to developers. Bridging that gap and giving more power to developers is a good thing.

