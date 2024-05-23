class WebGPUInteropPolyfill {
  getTextureFormat() {
    return 'rgba8unorm';
  }

  transferToGPUTexture(opts) {
    this._device = opts.device;
    this._outTexture = this._device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this._device.queue.copyExternalImageToTexture(
      { source: this.canvas },
      { texture: this._outTexture },
      [this.canvas.width, this.canvas.height]);
    return this._outTexture;
  }

  transferBackFromGPUTexture() {
    const canvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    const ctx = canvas.getContext("webgpu");
    ctx.configure({
      device: this._device,
      format: this._outTexture.format,
    });
    const mod = this._device.createShaderModule({ code: `
@vertex fn mainvs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array(vec2(3.0, 0.0), vec2(-1.0, -2.0), vec2(-1.0, 2.0));
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}

@group(0) @binding(0) var myTexture: texture_2d<f32>;
@fragment fn mainfs(@builtin(position) position : vec4f) -> @location(0) vec4f {
  return textureLoad(myTexture, vec2i(position.xy), 0);
}`
    });
    const pipeline = this._device.createRenderPipeline({
      layout: 'auto',
      vertex: {module: mod, entryPoint: 'mainvs'},
      fragment: {module: mod, entryPoint: 'mainfs',
        targets: [{ format: this._outTexture.format }]},
    });

    const bindGroup = this._device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: this._outTexture.createView() }],
    });

    const encoder = this._device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
          view: ctx.getCurrentTexture().createView(),
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(3);
    pass.end();
    this._device.queue.submit([encoder.finish()]);

    this._outTexture.destroy();
    delete this._outTexture;

    this.clearRect(0, 0, canvas.width, canvas.height);
    this.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }
}

for (const ctx of [CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D]) {
  for (const f of Object.getOwnPropertyNames(WebGPUInteropPolyfill.prototype)) {
    if (f === 'constructor' || ctx.prototype.hasOwnProperty(f)) continue;
    ctx.prototype[f] = WebGPUInteropPolyfill.prototype[f];
  }
}
