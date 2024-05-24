WebGPU Transfer
=======
**Status**: explainer.

This proposal tries to create better interoperability between Canvas 2D and WebGPU, addressing both performance and ergonomics problems. It provides a low level primitive to transfer a canvas' backbuffer to a WebGPU texture (resetting the canvas to an empty image), and a matching primitive to bring back that texture to Canvas2D.

There are two use cases in mind for this proposal:

1. Having access to text and path drawing in WebGPU.

2. Being able to apply WebGPU rendering (like filter effects, shaders, or simple rendering) in a canvas that is ultimately handled by Canvas2D.


Proposal
--------

```webidl
dictionary Canvas2dGPUTransferOption {
  // This GPUDevice will be given access to the canvas' texture.
  GPUDevice device;

  // This label will be assigned to the GPUTexture returned by transferToGPUTexture.
  DOMString? label;

  // This controls the GPUTextureUsage flags of the GPUTexture returned by
  // transferToGPUTexture. The default value will return a canvas texture that is
  // usable as a render attachment, and bindable as a 2D texture.
  GPUTextureUsageFlags usage = 0x14;  // TEXTURE_BINDING | RENDER_ATTACHMENT
};

[
    RuntimeEnabled=Canvas2dGPUTransfer,
    Exposed=(Window, Worker),
    SecureContext
] interface mixin Canvas2dGPUTransfer {
  [RaisesException] GPUTexture transferToGPUTexture(Canvas2dGPUTransferOption options);
  [RaisesException] undefined transferBackFromGPUTexture();
  GPUTextureFormat getTextureFormat();
};

CanvasRenderingContext2D includes Canvas2DGPUTransfer;
OffscreenCanvasRenderingContext2D includes Canvas2DGPUTransfer;
```

`transferToGPUTexture()` returns a [GPUTexture](https://gpuweb.github.io/gpuweb/#gputexture) that can be used in a WebGPU pipeline. After the function is called, the Canvas2D is returned to an empty, newly-initialized state.

`transferBackFromGPUTexture()` moves the `GPUTexture` back to the canvas, preserving any changes that were made to it in the interim. The `GPUTexture` enters a destroyed state, and becomes unavailable for further use in WebGPU.

An exception is raised if `transferBackFromGPUTexture()` is invoked before any calls to `transferToGPUTexture()`.

It is legal to invoke drawing commands on the Canvas2D context after `transferToGPUTexture` is invoked. The `GPUTexture` from the canvas remains in a valid state and can continue to be used. However, `transferBackFromGPUTexture()` is no longer allowed once the canvas has been drawn to; invoking it will raise an exception.

It is legal to invoke `transferToGPUTexture()` more than once without an intervening call to `transferBackFromGPUTexture()`. When this occurs, the previously-created GPUTexture will immediately enter a destroyed state and will no longer be usage. A new texture will be returned which holds the canvas' current contents.

Polyfill for the current proposal [here](../webgpu/webgpu-polyfill.js).

### Open issues and questions


Example usage
-------------

[Using Canvas2D as WebGPU texture with no copy](../webgpu/interop-demo.html)

[Using Canvas2D and WebGPU together with no copy](../webgpu/interop-demo-2.html)

Example for using 2D text on WebGPU:

```js
const device = await (await navigator.gpu.requestAdapter()).requestDevice();
const canvas = new OffscreenCanvas(256, 256);
const ctx = canvas.getContext('2d');
ctx.fillText("some text", 10, 50);

const canvasTexture = ctx.transferToGPUTexture({device: device});

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
const device = await (await navigator.gpu.requestAdapter()).requestDevice();
const canvas = document.createElement("canvas");
const ctx = canvas.getContext('2d');

// ... some Canvas2D work.
ctx.fillRect(0, 0, 1, 1);

const canvasTexture = ctx.transferToGPUTexture({device: device});

const pipeline = device.createRenderPipeline({fragment: {targets: [{
  format: ctx.getTextureFormat(),
}]}});

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

ctx.transferBackFromGPUTexture();

// ... continue Canvas2D work.
ctx.fillRect(1, 1, 1, 1);
```

References
----------

- [WebGPU spec](https://gpuweb.github.io/gpuweb)
