Feature
=======
**Status**: explainer.

A javascript interface for using SVG filters within canvas.

The SVG filter exposes deep, flexible drawing modifiers for 2d graphics. Integrating these into canvas 2d should be technically feasible once an interface is defined.

Proposal
--------

```webidl
interface CanvasFilter {
  attribute DOMString type; // "blend", "colorMatrix", "composite", "convolveMatrix",
   // "diffuseLighting", "displacementMap", "dropShadow", "gassianBlur", "image", 
   // "merge", "morphology", "specularLighting", "tile", "turbulence"

  attribute DOMString in; // Either another image element or filter primitive
  attribute DOMString in2; // Same as above

  attribute DOMString blendMode; // See https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
  attribute DOMMatrix values; // For colorMatrix
  attribute DOMString operator; // For composite and morphology 
  // see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/operator
  attribute DOMFloat32Array compositeWeights; // k1, k2, k3, k4 for composite type filters

  // etc for attributes of other filter types
};
```

Filters are instantiated with "type" according to types defined [here](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter). Attributes of the instantiated filter would reflect the relevant attributes per filter type: a Gaussian blur filter would expose attributes `stdDeviation` and `edgeMode` while a specular lighting filter would have attributes `surfaceScale`
`specularConstant`, `specularExponent` and `kernelUnitLength`, etc.

### Open issues and questions

- How should we handle 'SrcAlpha' type inputs?
- Would it make sense to have different `.idl`s and classes for each type of filter?
- Will it be hard to keep track of filter-stages inputs and outputs with this interface?
- Does a default "type" make any sense?
- Are offset and flood necessary? It seems like these are well covered by the canvas 2d interface already.
- Are the lighting operations possible?
- For componentTransfer, does it make sense to make a new js object for the function? I.e. allow users to input a function that transforms input `rgb` to output `rgb` like a fragment shader?


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Create filters
const turbulence = new CanvasFilter("turbulence");
turbulence.baseFrequency = 0.05;
turbulence.numOctaves = 2;
const displacementMap = new CanvasFilter("displacementMap");
displacementMap.in = canvas;
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

### Per filter-type idls

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
```

This approach has the advantage of making the `.idl` files simpler, but requires the users to know about many different new javascript objects.


References
----------

- https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter
- https://en.wikipedia.org/wiki/SVG_filter_effects
