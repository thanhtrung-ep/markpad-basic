/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url"
import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import manifest from "./manifest.config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [vue(), tailwindcss(), crx({ manifest })],
  build: { outDir: "dist", emptyOutDir: true },
  server: { port: 5199, strictPort: true, hmr: { port: 5199 } },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
})
