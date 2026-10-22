/*
  目标是要绘制100个三角形, 
  最基础的方案, 绘制完一个三角形后, 缓存,然后绘制下一个.
  这样draw命令多次调用, 也就会多次重复读取buffer. 
  所以利用存储缓冲区, 我把100个随机顶点都扔进缓冲区,
  这样就只需要绘制一次就好了.
*/

(async () => {
  // dom
  const app = document.querySelector("#app");
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  app.appendChild(canvas);
  // 初始化
  const adaper = await navigator.gpu.requestAdapter()
  const device = await adaper.requestDevice()
  const context = canvas.getContext("webgpu")
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device: device,
    format: presentationFormat
  })

  // module
  const module = device.createShaderModule({
    code: /* wgsl */`
      struct VSOut {
        @builtin(position) position: vec4f,
        @location(0) color: vec3f,
        @location(1) alpha: f32,
      }

      struct DefaultStruct {
        color: vec3f, // 颜色
        scale: vec2f, // 大小
        offset: vec2f, // 偏移
        alpha: f32, // 透明度
        rotate: f32, // 旋转
      };

      @group(0) @binding(0)
      var<storage, read> ds: array<DefaultStruct>;

      @vertex
      fn vs(
        @builtin(vertex_index) vertexIndex: u32,
        @builtin(instance_index) instanceIndex: u32,
      ) -> VSOut {

        // 顶点写死了
        let pos = array(
          vec2f( 0.5,  0.5),  
          vec2f( 0.5, -0.5),  
          vec2f(-0.5, -0.5),  
          vec2f( 0.5,  0.5), 
          vec2f(-0.5,  0.5), 
          vec2f(-0.5, -0.5), 
        );

        let instance = ds[instanceIndex];
        let position = pos[vertexIndex];

        let c = cos(instance.rotate);
        let s = sin(instance.rotate);

        // 1. 计算缩放
        let scaled = position * instance.scale;
        // 2. 计算旋转
        // x2 = x1 * cos(r) - y1 * sin(r)
        // y2 = x1 * sin(r) + y1 * cos(r)
        // let rotated = vec2f(
        //   scaled.x * c - scaled.y * s,
        //   scaled.x * s + scaled.y * c
        // );
        // 3. 平移偏移
        let finalPos = scaled + instance.offset;

        var vsOut: VSOut;
        vsOut.position = vec4f(finalPos, 0.0, 1.0);
        vsOut.color = instance.color;
        vsOut.alpha = instance.alpha;

        return vsOut;
      }

      @fragment
      fn fs(vsOut: VSOut) -> @location(0) vec4f {
        return vec4f(vsOut.color, vsOut.alpha);
      }
    `,
  })

  // 创建渲染管线
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: module,
    },
    fragment: {
      module: module,
      targets: [{
        format: presentationFormat,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha'
          },
          alpha: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha'
          }
        }
      }]
    },
    
  })

  // 实例数量
  const instanceCout = 1000000;
  // 配置buffer
  const singelBufferSize = 
  4 * 4 + // color 需要补充padding(4byted)
  2 * 4 + // scale
  2 * 4 + // offset
  1 * 4 + // alpha
  1 * 4 ; // rotate
  const bufferSize = singelBufferSize * instanceCout;
  const buffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  })
  const bufferValue = new Float32Array(bufferSize / 4)
  const aspect = window.innerWidth / window.innerHeight

  let offset = 0;
  for(let i = 0; i < instanceCout; i++) {
    // 颜色
    bufferValue.set([Math.random(), Math.random(), Math.random()], offset); offset += 4;
    // scale
    bufferValue.set([Math.random() * 0.5 * aspect, Math.random() * 0.5], offset); offset += 2;
    // offset
    bufferValue.set([(Math.random() * 2 - 1) * aspect , Math.random() * 2 - 1], offset); offset += 2;
    // alpha
    // bufferValue.set([Math.random() * 0.5 + 0.5], offset); offset += 1;
    bufferValue.set([0.1], offset); offset += 1;
    // rotate
    bufferValue.set([Math.random() * Math.PI], offset);
  }

  device.queue.writeBuffer(buffer, 0, bufferValue);

  // 创建bindGroup
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: buffer}
    ]
  })

  // 创建renderpass
  const renderPassDescirptor = {
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear',
        storeOp: 'store',
      }
    ]
  }

  // 创建编码器
  const encoder = device.createCommandEncoder()
  const pass = encoder.beginRenderPass(renderPassDescirptor)
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.draw(6, instanceCout)
  pass.end()

  const commanderBuffer = encoder.finish()
  device.queue.submit([commanderBuffer])
})()