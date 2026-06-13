import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
    commonjsOptions: {
      include: [/@mediapipe/],
    },
  },
  optimizeDeps: {
    include: ['@mediapipe/hands', '@mediapipe/camera_utils'],
  },
  resolve: {
    dedupe: ['@mediapipe/hands', '@mediapipe/camera_utils'],
  },
});
