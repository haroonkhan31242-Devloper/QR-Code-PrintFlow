import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Frontend-only app: `npm run dev` serves it on http://localhost:3000.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
  preview: { port: 3000 },
});
