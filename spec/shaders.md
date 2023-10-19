WebGPU Shaders
=======
**Status**: explainer.

As a follow up to [WebGPU Interop](spec/webgpu.md), we want to design a clean way
to use WebGPU fragment shaders as Canvas2D filters.

In theory, the interop primitives would allow this to be polyfilled, but
encapsulating the shaders as filter objects, would allow them to be used on layers,
which have much better ergonomics, as well as potentially better optimization on
some architectures.


Proposal
--------

```webidl

interface mixin CanvasShaderCreation {
  CanvasShader createCanvasShader(string wgslShader);
};

CanvasRenderingContext2D includes CanvasShaderCreation;
OffscreenCanvasRenderingContext2D includes CanvasShaderCreation;

[Exposed=(Window,Worker)] interface CanvasShader {
  undefined setUniforms(any uniforms);
  undefined setBlendState(GPUBlendState blendState);
  undefined setLayerSampler(GPUSampler sampler);
  undefined uploadTexture(string name, CanvasImageSource image, GPUSampler sampler);
}

typedef record<DOMString, CanvasShader, any> CanvasFilterPrimitive;
```

`createCanvasShader` allow the creation of a filter that encapsulates a WGSL shader,
with some limitations. Namely:

- there's only one binding group (0) that is the default. Uniforms, textures and samplers are definied and used in this binding group.
- there's only one entry point.
- there's always a texture available for sampling with the layer content.


### Open issues and questions


Example usage
-------------

```js
// Javascript example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const gpufilter = ctx.createCanvasShader(`
  var<uniform> width : f32;

  fn Filter(texcoord: vec2<f32>) -> vec4<f32> {
    return vec4(1.0, 0, 0, 1.0);
  }
`);

filter.setUniforms({width: 100});

ctx.beginLayer({filter: gpufilter});
ctx.fillRect(10, 10, 100, 100);
ctx.endLayer();

```


References
----------

- [WebGPU spec](https://gpuweb.github.io/gpuweb)
