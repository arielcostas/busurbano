import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";
import { reactRouter } from "@react-router/dev/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      '^/api': {
        target: 'https://localhost:7240',
        secure: false
      }
    }
  }
})
