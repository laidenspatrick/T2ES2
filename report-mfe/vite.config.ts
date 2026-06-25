import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'reportMfe',
      filename: 'remoteEntry.js',
      exposes: {
        // Ponto de entrada principal — o Shell importa este componente
        './App': './src/App.tsx',
        // Páginas individuais (para roteamento granular no Shell)
        './MyReports': './src/pages/MyReports.tsx',
        './MyProgress': './src/pages/MyProgress.tsx',
        './AdminDashboard': './src/pages/AdminDashboard.tsx',
        './AdminReports': './src/pages/AdminReports.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        '@mui/material': { singleton: true },
        '@emotion/react': { singleton: true },
        '@emotion/styled': { singleton: true },
      },
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 3105,
    cors: true,
  },
  preview: {
    port: 3105,
    cors: true,
  },
});
