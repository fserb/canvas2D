willReadFrequently
==================
**Status**: explainer.

Adds a `willReadFrequently` options to `CanvasRenderingContext2DSettings` to allow
signaling that this a Canvas that gets directly read a lot.

This allows UA to optimize Canvas2D for direct reading access through `getImageData`.


Proposal
--------

```webidl
dictionary CanvasRenderingContext2DSettings {
  // ... current values
  boolean willReadFrequently = false;
};
```

When the user sets `willReadFrequently` to true, the UA can optimize for read access, usually by not using the CPU for rendering.


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
