import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    port: 9002, // Maintain original port if desired
    host: '0.0.0.0', // Added host configuration
  },
});
