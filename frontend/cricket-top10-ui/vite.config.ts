import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/cricket-top10-game/",
  plugins: [react()],
});

