# Enhanced TextMetrics for Selection and Bounding Box

**Status**: explainer.

## Goals

Extend the capabilities of `TextMetrics` to support selection rectangles and bounding box queries over character ranges. This would additionally enable precise caret positioning.

## Rationale

Users should be able to interact with canvas-based text input (like Google Docs, VSCode, Miro) that correctly renders selection and caret positions.

All metrics available through DOM APIs should also be available on `measureText`. Furthermore, `measureText` will always be limited to a single style, and therefore has the potential to be much faster (as it doesn’t need layout). `measureText` must return the same value as the equivalent DOM APIs.

## Proposal

```webidl
[Exposed=(Window,Worker)] interface TextMetrics {
  // ... extended from current TextMetrics.
  
  sequence<DOMRectReadOnly> getSelectionRects(unsigned long start, unsigned long end);
  DOMRectReadOnly getActualBoundingBox(unsigned long start, unsigned long end);
};
```

Both functions operate in character ranges and return bounding boxes relative to the text’s origin (i.e., textBaseline/textAlign is taken into account).

`getSelectionRects()` returns the set of rectangles that the UA would render as selection to select a particular character range.

`getActualBoundingBox()` returns an equivalent box to `TextMetrics.actualBoundingBox`, i.e., the bounding rectangle for the drawing of that range. Notice that this can be (and usually is) different from the selection rect, as those are about the flow and advance of the text. A font that is particularly slanted or whose accents go beyond the flow of text will have a different paint bounding box. For example: if you select this: ***W*** you will see that the end of the W is outside the selection area, which would be covered by the paint (actual bounding box) area.

## Example usage

```js
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const tm = ctx.measureText("let's do this");
ctx.fillStyle = 'red';
const box_for_second_word = tm.getActualBoundingBox(6, 8);
ctx.fillRect(box_for_second_word.x, box_for_second_word.y,
        .width, box_for_second_word.height);
const selection_for_third_word = tm.getSelectionRects(9, 13);
ctx.fillStyle = 'lightblue';
for (const s of selection_for_third_word) ctx.fillRect(s.x, s.y, s.width, s.height);
ctx.fillStyle = 'black';
ctx.fillText("let's do this");
```

Expected output:

![enhanced textMetrics output](../images/enhanced-textmetrics-output.png)

## Alternatives and Open Questions

* Is `CaretPositionFromCursor()` needed? Can’t it be devised from `getSelectionRects()`?