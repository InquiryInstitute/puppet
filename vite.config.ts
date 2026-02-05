import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

// Copy index.html to route paths so /sim and /kleist are real files (no 404 → ?/path redirect)
function copyHtmlToRoutes() {
  return {
    name: 'copy-html-to-routes',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const indexPath = join(outDir, 'index.html')
      for (const route of ['sim', 'kleist']) {
        const dir = join(outDir, route)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        copyFileSync(indexPath, join(dir, 'index.html'))
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyHtmlToRoutes()],
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
    exclude: ['mujoco-js']
  },
  define: {
    'import.meta.env.VITE_GIT_COMMIT': JSON.stringify(getGitCommit())
  }
})
