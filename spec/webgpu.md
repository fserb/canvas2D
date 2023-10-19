WebGPU Integration
=======
**Status**: explainer.

This proposal tries to create a better interop between Canvas 2D and WebGPU, addressing both performance and ergonomics problems. It provides a low level primitive to transfer canvas' backbuffer to a WebGPU texture (disabling Canvas2D in the process), and a primitive to bring back that texture to Canvas2D.

There are 2 use cases in mind for this proposal:

1. Having access to text and path drawing in WebGPU.

2. Being able to apply WebGPU rendering (like filter effects, shaders, or simple rendering) in a canvas that is ultimately handled by Canvas2D.


Proposal
--------

```webidl
interface mixin Canvas2DWebGPU {
  GPUTexture moveToWebGPU();
  undefined moveFromWebGPU(GPUTexture texture);
};

CanvasRenderingContext2D includes Canvas2DWebGPU;
OffscreenCanvasRenderingContext2D includes Canvas2DWebGPU;
```

`moveToWebGPU()` returns a [GPUTexture](https://gpuweb.github.io/gpuweb/#gputexture) that can be used in a WebGPU pipeline. After the function is called, the Canvas2D context is unavailable, with all function calls throwing an InvalidStateError when called.

`moveFromWebGPU()` receives a WebGPU Texture (that has previoulsy been created via `moveToWebGPU()`), makes it unavailable to use on WebGPU, and restures the Canvas2D context.

### Open issues and questions


Example usage
-------------


Example for using 2D text on WebGPU:

```js
const canvas = new OffscreenCanvas(256, 256);
const ctx = canvas.getContext('2d');
ctx.fillText("some text", 10, 50);

const canvasTexture = ctx.moveToWebGPU();

const device = await (await navigator.gpu.requestAdapter()).requestDevice();
const pipeline = device.createRenderPipeline(...);

const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
});

device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: sampler,
    },
    {
      binding: 1,
      resource: canvasTexture.createView(),
    },
  ],
});

// ... continue WebGPU work.
```

Example for using WebGPU in Canvas 2D:

```js
const canvas = document.createElement("canvas");
const ctx = canvas.getContext('2d');

// ... some Canvas2D work.
ctx.fillRect(0, 0, 1, 1);

const canvasTexture = ctx.moveToWebGPU();

const device = await (await navigator.gpu.requestAdapter()).requestDevice();
const pipeline = device.createRenderPipeline(...);

const commandEncoder = device.createCommandEncoder();
const renderPassColorAttachment = {
  view: canvasTexture.createView(),
  clearValue: {r: 0, g: 0, b: 0, a: 1},
  loadOp:'clear',
  storeOp:'store'
};
const renderPassEncoder = commandEncoder.beginRenderPass({
  colorAttachments: [renderPassColorAttachment]
});
renderPassEncoder.setPipeline(renderPipeline);
renderPassEncoder.setBindGroup(0, uniformBindGroup);
renderPassEncoder.draw(3, 1, 0, 0);
renderPassEncoder.end();
device.queue.submit([commandEncoder.finish()]);

ctx.moveFromWebGPU(canvasTexture);

// ... continue Canvas2D work.
ctx.fillRect(1, 1, 1, 1);
```


References
----------

- [WebGPU spec](https://gpuweb.github.io/gpuweb)
