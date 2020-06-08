Canvas context loss
===================
**Status**: explainer.


2D Canvas Rendering contexts are currently required to have persistent backing stores. This proposal aims to relax that requirement by introducing an API that allows canvases to be discarded by the browser and re-drawn by the web application on demand.


Rationale
---------

This is a long standing [request](https://github.com/whatwg/html/issues/4809) from developers. It's particularly useful on Mobile, where context lost is more common.


Proposal
--------

```webidl
// WebIDL changes
interface mixin CanvasContextLost {
  boolean isContextLost();
};

CanvasRenderingContext2D includes CanvasContextLost;
OffscreenCanvasRenderingContext2D includes CanvasContextLost;
```

When the user agent detects that the backing storage associated with a Canvas2D context has been lost, it must run the following steps:

1. Let *canvas* be the context's canvas.
2. If *canvas*'s *context lost* flag is set, abort these steps.
3. Set *context lost* flag.
4. Queue a task to perform the following steps:
    1. Fire a event `contextlost` at *canvas*
    2. If the event's canceled flag is not set, abort these steps.
    3. Queue a task to restore the backing buffer for context.

UA could add support for "context loss test" by creating a
`console.resetGraphicsContext()` method.

### Open issues and questions

- Deprecate `webglcontextlost` in favor of `contextlost`?
- What the default behavior should be?

Example usage
-------------

```js
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener("contextlost", redraw);
```


References
----------

- https://wiki.whatwg.org/wiki/Canvas_Context_Loss_and_Restoration
