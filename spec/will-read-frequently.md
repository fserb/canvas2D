willReadFrequently
==================
**Status**: explainer.

Adds a `willReadFrequently` options to `CanvasRenderingContext2DSettings` to allow
signaling that this a Canvas that gets directly read a lot.

This allows UA to optimize Canvas2D for direct reading access through `getImageData`.


Rationale
---------

There's an important use case for apps/games that are very reliant on `getImageData`.
This operation is particularly slow when Canvas2D is being backed by accelerated graphics (GPU), that speed up considerably most other use cases.
Historically, browsers have tried heuristics to decide if a canvas is being read frequently or not, to switch code paths. This is unreliable, complex and brittle. To prevent this, we propose a hint option that will allow developers to tell the browser that this is a canvas that rely on `getImageData` performance.


Proposal
--------

```webidl
dictionary CanvasRenderingContext2DSettings {
  // ... current values
  boolean willReadFrequently = false;
};
```

When the user sets `willReadFrequently` to true, the UA can optimize for read access, usually by not using the GPU for rendering.


### Open issues and questions

None.

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', {willReadFrequently: true});

```

Alternatives considered
-----------------------


References
----------

- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
