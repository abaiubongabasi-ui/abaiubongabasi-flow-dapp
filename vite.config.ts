import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    checker({
      typescript: {
        root: ".",
        tsconfigPath: "./tsconfig.json",
        buildMode: true,
      },
      enableBuild: true,
      overlay: true,
      terminal: true,
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== "production",
    minify: "esbuild",
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: function (id) {
          if (id.includes("node_modules")) {
            if (id.includes("react/") || id.includes("react-dom/")) {
              return "react";
            }
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("@tanstack/react-router")
            ) {
              return "tanstack";
            }
            if (id.includes("@radix-ui/react-")) {
              return "radix";
            }
            if (id.includes("wagmi") || id.includes("viem")) {
              return "web3";
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 3000,
    strictPort: false,
    host: true,
  },
});
