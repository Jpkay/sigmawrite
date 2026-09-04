import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Plume",
    short_name: "Plume",
    description: "Français écrit personnalisé pour le collège",
    start_url: "/student",
    display: "standalone",
    background_color: "#F7F2E6",
    theme_color: "#A80049",
    lang: "fr",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
