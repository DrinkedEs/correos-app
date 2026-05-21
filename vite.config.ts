import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const REPO = "correos-app";

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${REPO}/` : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Correos SMTP",
        short_name: "Correos",
        description: "Envío de correos HTML vía SMTP propio",
        theme_color: "#156082",
        background_color: "#ffffff",
        display: "standalone",
        start_url: `/${REPO}/`,
        scope: `/${REPO}/`,
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
        ]
      },
      workbox: {
        navigateFallback: `/${REPO}/index.html`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ing\.fsmx\.foresightmexico\.mx\//,
            handler: "NetworkOnly"
          }
        ]
      }
    })
  ]
}));
