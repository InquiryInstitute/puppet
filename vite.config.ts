import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path: '/' for custom domain (puppet.inquiry.institute), '/puppet/' for GitHub Pages subdirectory
  base: process.env.CUSTOM_DOMAIN === 'true' ? '/' : (process.env.GITHUB_PAGES === 'true' ? '/puppet/' : '/'),
  server: {
    port: 3001,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure proper asset handling for GitHub Pages
    assetsDir: 'assets',
    // Optimize for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['mujoco']
  }
})
