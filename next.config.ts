import type { NextConfig } from "next";
import { assertDeploymentEnvironment } from "./lib/environment";

assertDeploymentEnvironment(process.env);

const quarantinedTourismImages = [
  "karnak-temple.jpg", "hurghada-desert-camel-profile.jpeg", "speedboat-shallow-water.jpeg", "hurghada-island-calm-sunset.jpeg", "orange-bay.jpeg", "hero.jpg", "hurghada-desert-camel-closeup.jpeg", "speedboat-cruise.jpeg", "senzo-transfer.jpg", "hurghada-snorkeling-sandy-seabed.jpeg", "desert-safari.jpg", "hurghada-island-family-sunset.jpeg", "hurghada-airport-transfer.jpg", "hurghada-island-beach-loungers.jpeg", "luxor-karnak-columns.jpeg", "hurghada-red-sea-coral-reef.jpeg", "transfer.jpg", "full-day-snorkeling.jpg", "luxor-day-trip.jpg", "scuba-diving.jpg", "hurghada-red-sea-scuba-diver.jpeg", "mahmya-island-boats-sunset.jpeg", "hurghada-desert-quad-tour.jpeg", "speedboat-guests.jpeg", "full-day-diving.jpg", "mahmya-island.jpg", "hurghada-snorkeling-reef-panorama.jpeg", "speedboat-orange-bay-branded.png", "speedboat-aerial.jpeg", "hurghada-island-sunset-sandals.jpeg", "quad-safari-sunset.jpg",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return [
      ...quarantinedTourismImages.map((file) => ({ source: `/images/${file}`, destination: "/images/placeholders/sea-activity.svg", permanent: false })),
      {
        source: "/lander",
        destination: "/",
        permanent: true,
      },
      {
        source: "/tours/transfer-to-and-from-senzo-mall",
        destination: "/tours/senzo-transfer",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dailyredsea.com" }],
        destination: "https://dailyredsea.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://graph.facebook.com; font-src 'self' data:; upgrade-insecure-requests" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
};

export default nextConfig;
