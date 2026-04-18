import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    outDir: 'build', // keep same output dir as CRA for deployment compatibility
  },
  server: {
    port: 3000,
    open: true,
  },
});
