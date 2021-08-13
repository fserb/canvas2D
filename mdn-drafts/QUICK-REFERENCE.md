## Description

The `CanvasRenderingContext2D` interface of the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) provides the 2D rendering context for the drawing surface of a `<canvas>` element. It is used for drawing shapes, text, images, and other objects.

**You can find [existing documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) for this interface on MDN. Chrome's work on [New Canvas 2D API](https://www.chromestatus.com/feature/6051647656558592) adds the following members.**

## Properties

**[`CanvasRenderingContext2D.fontKerning`](CanvasRenderingContext2D.fontKerning.md)**

Indicates whether kerning information stored in a font will be used. Kerning defines how letters are spaced. In well-kerned fonts, this feature makes character spacing appear to be more uniform and pleasant to read than it would otherwise be.

**[`CanvasRenderingContext2D.fontStretch`](CanvasRenderingContext2D.fontStretch.md)**

Sets or returns a font's font-face.

**[`CanvasRenderingContext2D.textLetterSpacing`](CanvasRenderingContext2D.textLetterSpacing.md)**

Returns a double that represents horizontal spacing between characters. Setting `textLetterSpacing` to postive values spreads characters further apart, while negative values brings them closer together. The default value is `0`.

**[`CanvasRenderingContext2D.textRendering`](CanvasRenderingContext2D.textRendering())**

Provides information to the rendering engine about what to optimize for when rendering text.

**[`CanvasRenderingContext2D.textWordSpacing`](CanvasRenderingContext2D.textWordSpacing.md)**

Returns a double that represents horizontal spacing between words. Setting `textWordSpacing` to postive values spreads words further apart, while negative values brings them closer together. The default value is `0`.

**[`CanvasRenderingContext2D.fontVariantCaps`](CanvasRenderingContext2D.fontVariantCaps.md)**

Controls use of alternate glyphs for capital letters. If multiple sizes of capital letter glyphs are available for the chosen font, this property chooses the one with appropriate size. Otherwise it synthesizes small-caps by adapting uppercase glyphs.

## Methods

**[`CanvasRenderingContext2D.reset()`](CanvasRenderingContext2D.reset.md)**

Resets the rendering context to its default state. This includes setting all pixels in the canvas to transparent black, clearing any saved states, clearing any stored path operations and resetting the drawing state to its initial values.

**[`CanvasRenderingContext2D.roundRect()`](CanvasRenderingContext2D.roundRect.md)**

Adds a rounded rectangle to the current sub-path.
