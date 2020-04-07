Feature
=======
**Status**: explainer.

A javascript interface for using SVG filters within canvas.

The SVG filter exposes deep, flexible drawing modifiers for 2d graphics.
Integrating these into canvas 2d should be technically feasible once an
interface is defined.

Proposal
--------

```webidl
// Parent class for filter primitives
interface CanvasFilterPrimitive {}

interface mixin CanvasFilter {
  // Defines functions that call constructors of primitives
  Blend(CanvasImageSource image, DOMString mode);
  ColorMatrix(DOMString type, DOMMatrix values);
  ComponentTransfer // TODO, this one is odd
  Composite(CanvasImageSource image, DOMString operation)
  ConvolveMatrix
  DiffuseLighting(double surfaceScale = 1, double diffuseConstant = 1);
  DisplacementMap(CanvasImageSource map, double strength = 1);
  Flood(); // Should this one take ctor args?
  GaussianBlur(double stdDeviation = 1);
  // Image is not necessary, I think
  Merge(CanvasImageSource image);
  Morphology(DOMString operator, double radius);
  Offset(double dx, double dy);
  SpecularLighting(); // ctor arguments?
  Tile(double x, double y, double width, double height);
  Turbulence(double baseFrequency = 1, double numOctaves = 1);

  // The wrapper function
  Sequence(CanvasFilterPrimitive[]);
}

interface mixin CanvasFilterLight {
  // Lighting CanvasLightingPrimitives
  DistantLight(double azimuth = 0, double elevation = 0);
  PointLight(double x = 0, double y = 0, double z = 0);
  SpotLight(double x = 0, double y = 0, double z = 0);
}

CanvasRenderingContext2D includes CanvasFilter;
OffscreenCanvasRenderingContext2D includes CanvasFilter;

// Primitive definitions
interface Blend : CanvasFilterPrimitive {
  constructor(CanvasImageSource image, DOMString mode);
  attribute CanvasImageSource image,
  attribute DOMString mode;
}
interface ColorMatrix : CanvasFilterPrimitive {
  constructor(DOMString type, DOMMatrix values);
  attribute DOMString mode;
  attribute DOMMatrix values;
}
interface ComponentTransfer : CanvasFilterPrimitive {} // TODO
interface Composite : CanvasFilterPrimitive {
  constructor(CanvasImageSource image, DOMString operation);
  attribute CanvasImageSource image;
  attribute DOMString operation;
}
interface DiffuseLighting : CanvasFilterPrimitive {
  constructor(double surfaceScale = 1, double diffuseConstant = 1);
  attribute CanvasLightingPrimitive light;
  attribute double surfaceScale;
  attribute double diffuseConstant;
}
interface DisplacementMap : CanvasFilterPrimitive{
  constructor(CanvasImageSource map, double strength = 1);
  attribute CanvasImageSource map;
  attribute double strength;
}
interface Flood : CanvasFilterPrimitive{
  constructor();
  attribute (DOMString or CanvasGradient or CanvasPattern) color;
  attribute double opacity;
}
interface GaussianBlur : CanvasFilterPrimitive {
  constructor(double stdDeviation = 1);
  attribute double stdDeviation;
}
interface Merge : CanvasFilterPrimitive {
  constructor(CanvasImageSource image);
  attribute CanvasImageSource image;
}
interface Morphology : CanvasFilterPrimitive {
  constructor(DOMString operator, double radius);
  attribute DOMString operator;
  attribute double radius;
}
interface Offset : CanvasFilterPrimitive {
  constructor(double dx, double dy);
  attribute double dx;
  attribute double dy;
}
interface SpecularLighting : CanvasFilterPrimitive {
  constructor();
  attribute double surfaceScale;
  attribute double specularConstant;
  attribute double specularExponent;
  attribute double kernelUnitLength;
  attribute (DOMString or CanvasGradient or CanvasPattern) color; 
  attribute CanvasLightingPrimitive light;
}
interface Tile : CanvasFilterPrimitive {
  constructor(double x, double y, double width, double height);
  attribute double x;
  attribute double y;
  attribute double width;
  attribute double height;
}
interface Turbulence : CanvasFilterPrimitive {
  constructor(double baseFrequency = 1, double numOctaves = 1);
  attribute double baseFrequency;
  attribute double numOctaves;
  attribute double seed = 0;
  attribute DOMString stitchTiles = "noStitch";
  attribute DOMString type = "turbulence";
}

// Lights
interface DistantLight : CanvasLightingPrimitive {
  constructor(double azimuth = 0, double elevation = 0);
  attribute double azimuth;
  attribute double elevation;
}
interface PointLight : CanvasLightingPrimitive {
  constructor(double x = 0, double y = 0, double z = 0);
  attribute double x;
  attribute double y;
  attribute double z;
}
interface SpotLight : CanvasLightingPrimitive {
  constructor(double x = 0, double y = 0, double z = 0);
  attribute double x;
  attribute double y;
  attribute double z;
}

// Finally, the sequence object
interface Sequence {
  /*
    The implementation of this constructor will turn all unused inputs (i.e.
    first primitives on the filter chain) into drawOp inputs. Every filter
    primitive in the array will be chained with the following one. The final
    stage will be the output.
  */
  constructor(CanvasFilterPrimitives[]);
}
```

### Open issues and questions

- Is having constructors for other objects possible in `.idl` files?
- How should we handle 'SrcAlpha' type inputs?
- Will it be hard to keep track of filter-stages inputs and outputs with this
interface?
- Are the lighting operations possible?
- Make filters immutable. What about an `update()` function?
- Should they not take args in the ctor?
- Lighting primitives are parents of lights, is that appropriate?

Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Create filter primitives
const turbulence = new CanvasFilter.Turbulence(
  0.05 /* base frequency */, 2 /* numOctaves */);
const displacementMap = new CanvasFilter.DisplacementMap(
  turbulence /* displacement map */, 30 /* strength */);
const blur = new CanvasFilter.GaussianBlur(2 /* std deviation */);

/*
  Create overall filter, the first primitive will get drawing operations as input
  the output of each primitive will be sent to the input of the following element
  in the array. The final element will output to the screen.

  Here the final filter graph will look like this:

                          turbulence
                              |
  canvasDrawOps -----> displacementMap -------> blur ------> screen
*/
ctx.filter = new CanvasFilter.Sequence([displacementMap, blur]);

// Draw with created filter
ctx.fillStyle = "magenta";
ctx.fillRect(10, 10, 300, 200);

// Modify filter
turbulence.baseFrequency = 1.5; // Denser noise pattern
blur.stdDeviation = 0.5; // Less blur

ctx.filter = new CanvasFilter.Sequence([displacementMap, blur]);
// or, with an update function, just ctx.filter.update()

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
