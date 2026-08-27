import { defineConfig } from 'vite';

// Cesium 需要四个静态资源目录（Workers、ThirdParty、Assets、Widgets）
// 已复制到 public/Cesium/，通过 /Cesium/ 路径访问
export default defineConfig({
  define: {
    // 在编译阶段将 CESIUM_BASE_URL 替换为实际路径
    // 必须在 import cesium 之前生效，不能用 window.CESIUM_BASE_URL
    CESIUM_BASE_URL: JSON.stringify('/Cesium/'),
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});
