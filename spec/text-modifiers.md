Text Modifiers
==============
**Status**: explainer.

Currently, some CSS text rendering properties can't be used for canvas text.
Some browsers do support setting them a Canvas style object, for an attached
canvas. This spec tries to bring those properties inside canvas.

Those should be trivially implemented, as they are already support by CSS.


Rationale
---------

There are many applications that want to use more modern text parameters that browsers current support but are not available on Canvas.

There are many web apps (from Adobe, Microsoft, Google) that are looking forward for this feature.


Proposal
--------

```webidl
interface mixin CanvasTextDrawingStyles {
  // current values (font, textAlign, textBaseline, direction)...

  // new values
  attribute DOMString textLetterSpacing;      // CSS letter-spacing
  attribute DOMString textWordSpacing;        // CSS word-spacing
  attribute DOMString fontVariant;            // CSS font-variant
  attribute DOMString fontKerning;            // CSS font-kerning
  attribute DOMString fontStretch;            // CSS font-stretch
  attribute DOMString textDecoration;         // CSS text-decoration
  attribute DOMString textUnderlinePosition;  // CSS text-underline-position
  attribute DOMString textRendering;          // CSS text-rendering
};
```

Those properties behave similarly to other text properties on Canvas and have
the same effect as their CSS equivalents.

### Open issues and questions

- should we normalize the prefix to be always `text` instead of `text` and `font`?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.textLetterSpacing = "3px";
ctx.textDecoration = "underline";

```

Alternatives considered
-----------------------

None.


References
----------

None.
