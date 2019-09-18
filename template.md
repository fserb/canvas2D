Feature
=======
**Status**: explainer.

{summary}

{goals and use cases}


Proposal
--------

```webidl
interface mixin CanvasFeature {

};

CanvasRenderingContext2D includes CanvasFeature;
OffscreenCanvasRenderingContext2D includes CanvasFeature;
```

{overall usage}

### Open issues and questions


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

```

Alternatives considered
-----------------------

### Alternative 1

{notes}


References
----------

- {link1}
