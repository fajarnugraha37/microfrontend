import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/ — using Vue plugin so .vue files are processed
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
})
