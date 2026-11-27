import type { MetadataRoute } from "next";
import { CONTAMINANTS } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/registry`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/contaminants`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pws`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const contaminantRoutes: MetadataRoute.Sitemap = CONTAMINANTS.map((c) => ({
    url: `${SITE_URL}/contaminants/${c.code}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Water-system reference pages are noindex until verified records are available.
  return [...staticRoutes, ...contaminantRoutes];
}
