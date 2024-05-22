import "./webgpu-polyfill.js";

class CanvasShader {
  constructor(opts) {
    this.opts = opts;
  }

  async init() {
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();

    this.vert = this.device.createShaderModule({ code: `
@vertex fn mainvs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4f {
  var pos = array(vec2(3.0, 0.0), vec2(-1.0, -2.0), vec2(-1.0, 2.0));
  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`});
    this.frag = this.device.createShaderModule({code: this.opts.code});
  }

  applyFilter(octx) {
    const canvas = new OffscreenCanvas(octx.canvas.width, octx.canvas.height);
    const ctx = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({
      device: this.device,
      format: format,
      alphaMode: 'premultiplied',
    });

    const texture = octx.transferToWebGPU({device: this.device});

    const pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {module: this.vert, entryPoint: 'mainvs'},
      fragment: {module: this.frag, entryPoint: 'mainfs',
        targets: [{ format: format}]},
    });
    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: texture.createView() }],
    });
    const encoder = this.device.createCommandEncoder();
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
    this.device.queue.submit([encoder.finish()]);

    return canvas;
  }
}

class CanvasShaderPolyfill {
  async createCanvasShader(opts) {
    const cs = new CanvasShader(opts);
    await cs.init();
    return cs;
  }

  beginLayer(filter) {
    if (this._beginLayer && !(filter instanceof CanvasShader)) {
      return this._beginLayer(filter);
    }

    this._layerCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    this._layer = this._layerCanvas.getContext("2d");
    this._layerFilter = filter;
  }

  endLayer() {
    if (!this._layer && this._endLayer) {
      return this._endLayer();
    }

    const ctx = this._layer;
    const canvas = this._layerCanvas;
    const filter = this._layerFilter;
    delete this._layer;
    delete this._layerCanvas;
    delete this._layerFilter;

    const out = filter.applyFilter(ctx);

    this.save();
    this.drawImage(out, 0, 0);
    this.restore();
  }
}

for (const ctx of [CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D]) {
  ctx.prototype._beginLayer = ctx.prototype.beginLayer;
  ctx.prototype._endLayer = ctx.prototype.endLayer;
  ctx.prototype.beginLayer = CanvasShaderPolyfill.prototype.beginLayer;
  ctx.prototype.endLayer = CanvasShaderPolyfill.prototype.endLayer;

  for (const f of Object.getOwnPropertyNames(CanvasShaderPolyfill.prototype)) {
    if (f === 'constructor' || ctx.prototype.hasOwnProperty(f)) continue;
    if (f === 'beginLayer' || f == 'endLayer') continue;
    ctx.prototype[f] = CanvasShaderPolyfill.prototype[f];
  }
}

export function CanvasShaderContext(ctx) {
  return new Proxy(ctx, {
    get: function(target, key) {
      if (target._layer && key !== 'endLayer') {
        if (typeof target._layer[key] === "function") {
          return function(...args) {
            return target._layer[key](...args);
          }
        } else {
          return target._layer[key];
        }
      } else {
        if (typeof target[key] === "function") {
          return function(...args) {
            return target[key](...args);
          }
        } else {
          return target[key];
        }
      }
    },

    set: function(target, key, value) {
      if (target._layer) {
        target._layer[key] = value;
      } else {
        target[key] = value;
      }
      return true;
    }
  });
}
