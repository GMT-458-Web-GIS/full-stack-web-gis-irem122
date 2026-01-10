import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/full-stack-web-gis-irem122/',

  root: '.',

  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
  input: {
    main: resolve(__dirname, 'index.html'),
    login: resolve(__dirname, 'login.html'),
    register: resolve(__dirname, 'register.html'),
    map: resolve(__dirname, 'map.html'),
    auth: resolve(__dirname, 'auth.html'),
    admin: resolve(__dirname, 'admin.html'),
    adminLogin: resolve(__dirname, 'admin-login.html'),
    adminDashboard: resolve(__dirname, 'admin-dashboard.html')
  }
}

  }
})