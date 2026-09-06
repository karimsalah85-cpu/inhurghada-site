import type { MetadataRoute } from "next";
import { defaultDescription, siteName } from "@/lib/seo";

// Served at /manifest.webmanifest. Next injects <link rel="manifest"> automatically.
// Gives Chrome / Android "Add to Home Screen" the brand icon instead of a
// screenshot-derived fallback.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A2D57",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
