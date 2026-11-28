import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WaterQualityLens — public water system records",
    short_name: "WaterQualityLens",
    description:
      "Look up possible water systems by ZIP code, find official reports, and browse independent filter certifications.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#1b3e59",
    categories: ["utilities", "reference", "health"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
