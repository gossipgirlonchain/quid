import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// PWA (manifest + service worker + web push) is added in a later milestone.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Proxy API calls to the agent's consumer-app backend (npm run server, port 8787).
  server: {
    proxy: {
      "/api": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
});
