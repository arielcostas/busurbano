import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/api': {
        target: 'https://localhost:7240',
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router'],
          leaflet: ['leaflet', 'react-leaflet', 'leaflet.locatecontrol', 'leaflet.markercluster']
        }
      }
    }
  }
})
