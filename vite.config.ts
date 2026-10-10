import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import angioLibrary from "./scripts/vite-angio-library.mjs";
import buildStatus from "./scripts/vite-build-status.mjs";

export default defineConfig({
  plugins: [react(), angioLibrary("."), buildStatus(".")],
  server: {
    port: 5173,
    open: true,
  },
});
