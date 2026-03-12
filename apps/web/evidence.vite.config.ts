import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@clerk/nextjs': path.resolve(__dirname, './src/evidence/clerk-shim.tsx'),
      'next/image': path.resolve(__dirname, './src/evidence/next-image-shim.tsx'),
      'next/link': path.resolve(__dirname, './src/evidence/next-link-shim.tsx'),
      'next/navigation': path.resolve(__dirname, './src/evidence/next-navigation-shim.ts'),
    },
  },
});
