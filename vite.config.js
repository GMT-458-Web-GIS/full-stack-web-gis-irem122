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
    login: resolve(__dirname, 'pages/login.html'),
    register: resolve(__dirname, 'pages/register.html'),
    map: resolve(__dirname, 'pages/map.html'),
    auth: resolve(__dirname, 'pages/auth.html'),
    admin: resolve(__dirname, 'pages/admin.html'),
    adminLogin: resolve(__dirname, 'pages/admin-login.html'),
    adminDashboard: resolve(__dirname, 'pages/admin-dashboard.html')
  }
}

  }
})