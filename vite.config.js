import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      web3: path.resolve(__dirname, 'src/web3.js'), // Explicitly map "web3"
    },
  },
});
