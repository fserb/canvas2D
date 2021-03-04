Filter alternatives
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

// ... set filter

ctx.fillStyle = "magenta";
ctx.fillRect(10, 10, 300, 200);

// ... modify filter

ctx.fillStyle = "cyan";
ctx.beginPath();
ctx.arc(160, 110, 80, 0, 2 * Math.PI);
ctx.fill();
```


Class-based, top-level object
-----------------------------
```js
const turbulence = new CanvasFilter.Turbulence(
  0.05 /* base frequency */, 2 /* numOctaves */);
const displacementMap = new CanvasFilter.DisplacementMap(
  turbulence /* displacement map */, 30 /* strength */);
const blur = new CanvasFilter.GaussianBlur(2 /* std deviation */);

ctx.filter = new CanvasFilter.Sequence([displacementMap, blur]);

// Modify filter
turbulence.baseFrequency = 1.5; // Denser noise pattern
blur.stdDeviation = 0.1;
ctx.filter = blur; // commit happens when filter is set.
blur.stdDeviation = 0.5; // Less blur
ctx.filter = blur; // any update needs to be set again.

ctx.filter = new CanvasFilter.Sequence([displacementMap, blur]);

// Class-based could also support mongo-syntax sugar:
ctx.filter = CanvasFilter([{displacementMap: {
    strength: 30,
    map: {turbulence: {baseFrequency: 0.05, numOctaves: 2}},
  {gaussianBlur: 2}]);
```


MongoDB-like syntax
-------------------
```js
ctx.filter = new CanvasFilter([{displacementMap: {turbulence: [0.05, 2]}, {gaussianBlur: 2}]);

ctx.filter = new CanvasFilter([
  {displacementMap: {
    strength: 30,
    map: {turbulence: {baseFrequency: 0.05, numOctaves: 2}},
  {gaussianBlur: 2}]);
  
// single step version (no array)
ctx.fitler = new CanvasFilter({gaussianBlur: 2});
```


Function-based, top-level object
-----------------------------
```js
const turbulence = CanvasFilter.Turbulence(
  0.05 /* base frequency */, 2 /* numOctaves */);
const displacementMap = CanvasFilter.DisplacementMap(
  turbulence /* displacement map */, 30 /* strength */);
const blur = CanvasFilter.GaussianBlur(2 /* std deviation */);

ctx.filter = CanvasFilter.Sequence([displacementMap, blur]);

// Modify filter
turbulence.baseFrequency = 1.5; // Denser noise pattern
blur.stdDeviation = 0.5; // Less blur
ctx.filter = [displacementMap, blur];
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

// Attach output filter to canvas
ctx.filter = outputFilter;

// Modify filter
turbulence.baseFrequency = 1.5; // Denser noise pattern
blur.stdDeviation = 0.5; // Less blur
ctx.filter.update();
```
