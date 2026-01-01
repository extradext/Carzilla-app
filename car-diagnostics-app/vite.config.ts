import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Required for Emergent preview domains.
    allowedHosts: true,
  },
});
