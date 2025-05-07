import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/functions/v1/quick-worker': {
        target: 'https://yxmqzkxszdcezurxjqae.supabase.co',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Voeg de benodigde headers toe
            proxyReq.setHeader('x-application-name', 'mic-registratie');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'x-application-name, authorization, x-client-info, apikey, content-type');
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
          });
        }
      }
    }
  }
})
