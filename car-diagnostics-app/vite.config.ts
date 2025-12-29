import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal Vite + React + TS config.
export default defineConfig({
  plugins: [react()],
});
