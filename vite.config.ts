import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // Example for Vue.js, adjust if using a different framework
// Import additional plugins if needed

export default defineConfig({
  plugins: [vue()], // Add any additional plugins here
  build: {
    outDir: 'dist', // Output directory for build files
    emptyOutDir: true, // Clear the output directory before building
  },
  server: {
    port: 3000, // Set the port for the development server, adjust as needed
  },
  resolve: {
    alias: {
      '@': '/src', // Create an alias for easier imports
    },
  }
});