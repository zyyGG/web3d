(async function () {
  const adaper = await navigator.gpu.requestAdapter()
  const device = await adaper.requestDevice()
  if(!device) return;
  const app = document.querySelector("#app");
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  app.appendChild(canvas);
  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: presentationFormat,
  });

  // shader module
  const module = device.createShaderModule({
    label: "default shader module",
    code: /*wgsl*/`

    `
  })
})()