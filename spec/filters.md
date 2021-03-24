Feature
=======
**Status**: explainer.

A javascript interface for using SVG filters within canvas.

The SVG filter exposes deep, flexible drawing modifiers for 2d graphics.
Integrating these into canvas 2d should be technically feasible once an
interface is defined.

[Alternative usages](https://github.com/fserb/canvas2D/blob/master/spec/filters-usage.md)


Rationale
---------

A strong filter library is available on all major 2D APIs. A lot of those filters are currently implemented inderectly by Canvas2D supporting URL filters (but not on OffscreenCanvas).

This proposal tries to build up the basis for having more interesting filters available directly on canvas, programatically.


Proposal
--------

```webidl
// CanvasFilter, exposed to window and workers
// with generic objects we don't need to define every filter within idl files
[
    Exposed=(Window,Worker), RuntimeEnabled=NewCanvas2DAPI
] interface CanvasFilter {
    [CallWith=(ScriptState), RaisesException] constructor((object or FrozenArray<object>) init);
};
```

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

/*
  Create overall filter, the first primitive will get drawing operations as input
  the output of each primitive will be sent to the input of the following element
  in the array. The final element will output to the screen.

  Here the final filter graph will look like this:

                          turbulence
                              |
  canvasDrawOps -----> displacementMap -------> blur ------> screen
*/

// Definiing to a separate object will allow us to vary parameters
let filterArray = [{turbulence: {frequency: 0.05, numOctaves: 2}},
  {displacementMap: {in: "SourceGraphic", in2: "previous", scale: 30},
  {blur: {stdDeviation: 2}}];

// Construct the canvas filter
ctx.filter = new CanvasFilter(filterArray);

// Draw with created filter
ctx.fillStyle = "magenta";
ctx.fillRect(10, 10, 300, 200);

// Modify filter
filterArray[2]['turbulence']['frequency'] = 1.5; // Denser noise pattern
filterArray[3]['blur']['stdDeviation'] = 0.5; // Less blur

// Must construct a new filter object
ctx.filter = new CanvasFilter(filterArray);

// Draw on top with modified filter
ctx.fillStyle = "cyan";
ctx.beginPath();
ctx.arc(160, 110, 80, 0, 2 * Math.PI);
ctx.fill();
```

The above code will produce the the following canvas:

![image](../images/filtered-canvas.png)

Alternatives considered
-----------------------

### Explicit inputs and outputs

```webidl
interface CanvasFilter {
  attribute CanvasImageSource in;
  attribute CanvasImageSource in2;
}

interface CanvasGaussianBlurFilter : CanvasFilter {
  attribute unrestricted double stdDeviation;
  attribute DOMString edgeMode; // "duplicate", "wrap", "none" (default "none")
}
```

```js
const blurFilter = new CanvasGaussianBlurFilter();

// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Create filters
const turbulence = new CanvasFilter("turbulence");
turbulence.baseFrequency = 0.05;
turbulence.numOctaves = 2;
const displacementMap = new CanvasFilter("displacementMap");
displacementMap.in = ctx; // Draw ops as inputs
displacementMap.in2 = turbulence;
displacementMap.scale = 30;
const outputFilter = new CanvasFilter();
outputFilter.type = "gaussianBlur";
outputFilter.in = displacementMap;
outputFilter.stdDeviation = 2;

// Attach output filter to canvas
ctx.filter = outputFilter;

// Draw with created filter
ctx.fillStyle = "magenta";
ctx.fillRect(10, 10, 300, 200);

// Modify filter
turbulence.baseFrequency = 1.5; // Denser noise pattern
blur.stdDeviation = 0.5; // Less blur
ctx.filter.update();

// Draw on top with modified filter
ctx.fillStyle = "cyan";
ctx.beginPath();
ctx.arc(160, 110, 80, 0, 2 * Math.PI);
ctx.fill();
```

This approach forgoes the `Sequence` class in favor of making inputs more
explicit. The downside is that without the final filter construction phase it's
less clear what's going on. Also the code to make draw ops inputs is not
straightforward.


References
----------

- https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
- https://en.wikipedia.org/wiki/SVG_filter_effects
