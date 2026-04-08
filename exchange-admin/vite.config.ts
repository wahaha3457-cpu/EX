import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_ADMIN_STANDALONE': JSON.stringify('true'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'ep-icons': ['@element-plus/icons-vue'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    /** 监听 0.0.0.0，同一局域网内可用本机 IP + 端口访问 */
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      /** Binance 公开 REST：浏览器直连有 CORS 限制，开发环境走代理 */
      '/binance-api': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/binance-api/, ''),
      },
      /** 币安 U 本位合约公开行情（全站 ticker 合约 Tab） */
      '/binance-fapi': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/binance-fapi/, ''),
      },
      /**
       * 原项目测试环境认证等接口（避免浏览器直连跨域）。
       * 前端 legacy 模式 baseURL 默认 `/legacy-api`，此处转发到站点 `/api`。
       */
      '/legacy-api': {
        target: 'https://bian50test.qdjkdo.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/legacy-api/, '/api'),
      },
      /** CoinDesk RSS：浏览器直连跨域，开发环境走同源代理（见 src/api/news/coindeskRss.ts） */
      '/coindesk-rss': {
        target: 'https://www.coindesk.com',
        changeOrigin: true,
        rewrite: () => '/arc/outboundfeeds/rss',
      },
    },
  },
})
