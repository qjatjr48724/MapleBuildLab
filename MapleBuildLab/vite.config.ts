import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MS_REGION?: string;
  readonly VITE_MS_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
