import { defineConfig } from 'vite';
import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
