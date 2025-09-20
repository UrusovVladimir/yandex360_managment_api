import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  envPrefix: 'VITE_',
  server: {
    port: 8080,
    host: '0.0.0.0',
    // HTTPS конфигурация
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem'
    }
  }
})