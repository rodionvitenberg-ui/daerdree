import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";

const staticPaths = [
  { path: "", priority: 1.0 },
  { path: "/menu", priority: 0.8 },
  { path: "/games", priority: 0.9 },
  { path: "/events", priority: 0.8 },
  { path: "/book", priority: 0.9 },
  { path: "/faq", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "ru"];
  const entries: MetadataRoute.Sitemap = [];

  for (const route of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route.priority,
      });
    }
  }

  return entries;
}