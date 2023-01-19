Filter syntax alternatives
===================
**Status**: explainer.

A javascript interface for using SVG filters within canvas.

The SVG filter exposes deep, flexible drawing modifiers for 2d graphics.
Integrating these into canvas 2d should be technically feasible once an
interface is defined.

boilerplate:
```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.beginLayer(/* filter parameter */)
ctx.fillStyle = "magenta";
ctx.fillRect(10, 10, 300, 200);
ctx.endLayer();
```

Last approved (but reverted) spec change (https://github.com/whatwg/html/pull/6763):

```js
ctx.beginLayer(new CanvasFilter([
  {
    filter: "colorMatrix",
    type: "matrix",
    values: [
      0, 1, 0, 0, 0,
      1, 0, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0
    ],
  },
  {
    filter: "gaussianBlur",
    stdDeviation: 5,
  }
]));

// If we overload `beginLayer` to add alpha and composite operation:
ctx.beginLayer({
  filter: new CanvasFilter([
      {
        filter: "colorMatrix",
        type: "matrix",
        values: [
          0, 1, 0, 0, 0,
          1, 0, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0
        ],
      },
      {
        filter: "gaussianBlur",
        stdDeviation: 5,
      }
    ]),
  alpha: 0.5,
  compositeOperation: "xor"});

// Optimizing away the temporary CanvasFilter object. This produces an
// ambiguous API with the `filter` key meaning different things (e.g.
// is the argument passed to `beginLayer` a filter or an options object?)
ctx.beginLayer({
  filter: [
      {
        filter: "colorMatrix",
        type: "matrix",
        values: [
          0, 1, 0, 0, 0,
          1, 0, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0
        ],
      },
      {
        filter: "gaussianBlur",
        stdDeviation: 5,
      }
    ],
  alpha: 0.5,
  compositeOperation: "xor"});

// Alternative key names, avoiding using `filter:` at two different levels:
ctx.beginLayer({
  filter: { name: "gaussianBlur",
            stdDeviation: 5 },
  alpha: 0.5,
  compositeOperation: "xor"});

ctx.beginLayer({
  filter: { filter_name: "gaussianBlur",
            stdDeviation: 5 },
  alpha: 0.5,
  compositeOperation: "xor"});

ctx.beginLayer({
  filters: { filter: "gaussianBlur",
             stdDeviation: 5 },
  alpha: 0.5,
  compositeOperation: "xor"});
```

Pros:
 - Simple to spec, document and implement. We can reuse the SVG specification
   and documentation. Implementation uses a simple IDL definition.


Class-based, top-level object
-----------------------------
```js
const turbulence = new CanvasFilter.Turbulence(
  /*baseFrequency=*/0.05, /*numOctaves=*/2);
const displacementMap = new CanvasFilter.DisplacementMap(
  /*displacementMap=*/turbulence, /*strength=*/30);
const blur = new CanvasFilter.GaussianBlur(/*stdDeviation=*/2);

ctx.beginLayer(new CanvasFilter.Sequence([displacementMap, blur]));

ctx.beginLayer({
    filter: new CanvasFilter.Sequence([displacementMap, blur])
    alpha: 0.5,
    compositeOperation: "xor"
  });
```

Pros:
 - Fully typed syntax, IDL-validated.

Cons:
 - Complex to spec, document and implement. We would essentially need to
   re-write the SVG filter spec and write an IDL interface for every single
   filters.


MongoDB-like syntax
-------------------
```js
ctx.beginLayer(new CanvasFilter([
    {displacementMap: {turbulence: [0.05, 2]}},
    {gaussianBlur: 2}
  ]));

ctx.beginLayer(new CanvasFilter([
    {displacementMap: {
      strength: 30,
      map: {turbulence: {baseFrequency: 0.05, numOctaves: 2}}},
    {gaussianBlur: 2}
  ]));

// single step version (no array)
ctx.beginLayer(new CanvasFilter({gaussianBlur: 2}));

// With alpha and composite operation:
ctx.beginLayer({
  filter: new CanvasFilter([
      {displacementMap: {
        strength: 30,
        map: {turbulence: {baseFrequency: 0.05, numOctaves: 2}}},
      {gaussianBlur: 2}
    ]),
  alpha: 0.5,
  compositeOperation: "xor"
});
```

Pros:
 - Minimal syntax, fun to use.

Cons:
 - Using filter type as key suggests that one could do:
   ```js
   new CanvasFilter({gaussianBlur: 2, displacementMap: {...}})
   ```



Function-based, top-level object
-----------------------------
```js
const turbulence = CanvasFilter.Turbulence(
  /*baseFrequency=*/0.05, /*numOctaves=*/2);
const displacementMap = CanvasFilter.DisplacementMap(
  /*displacementMap=*/turbulence, /*strength=*/30);
const blur = CanvasFilter.GaussianBlur(/*stdDeviation=*/2);

ctx.beginLayer(CanvasFilter.Sequence([displacementMap, blur]));

// With alpha and composite operation:
ctx.beginLayer({
    filter: CanvasFilter.Sequence([displacementMap, blur]),
    alpha: 0.5,
    compositeOperation: "xor"
  });
```


Single-class, parameters
------------------------
```js
// here either windows.CanvasFilter or ctx.createCanvasFilter

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

// Use output filter in canvas
ctx.beginLayer(outputFilter);
```
