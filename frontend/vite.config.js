import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Target modern browsers — smaller bundles, no legacy transforms
    target: 'es2020',

    // Raise warning threshold (default 500kB is too noisy)
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // Three.js + Photo Sphere Viewer — only loaded when VR is opened
          if (id.includes('@photo-sphere-viewer') || id.includes('three')) {
            return 'vr-viewer';
          }
          // Google OAuth — only needed on auth pages
          if (id.includes('@react-oauth') || id.includes('google-auth')) {
            return 'google-auth';
          }
          // React core — changes almost never, aggressively cached
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Routing
          if (id.includes('react-router')) {
            return 'router';
          }
          // UI utilities
          if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('axios')) {
            return 'ui-libs';
          }
        },

        // Content-hash filenames for perfect long-term caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Minify with esbuild (default, fast) — switch to 'terser' for ~5% smaller bundles
    minify: 'esbuild',

    // Enable source maps for prod debugging (optional — remove if you want smaller files)
    sourcemap: false,
  },

  // Faster dev-server HMR
  server: {
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/components/layout/Navbar.jsx',
        './src/pages/HomePage.jsx',
        './src/pages/listings/ListingsPage.jsx',
      ],
    },
  },

  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
    },
  },
});