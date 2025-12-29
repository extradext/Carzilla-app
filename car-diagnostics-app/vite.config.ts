
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // bind 0.0.0.0
    port: 3000,              // preview expects this
    strictPort: true,        // don't auto-switch
    allowedHosts: [
      ".emergentagent.com",  // wildcard = future-proof
    ],
  },
});