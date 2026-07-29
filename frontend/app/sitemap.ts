import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const staticPaths = [
  { path: "", priority: 1.0 },
  { path: "/menu", priority: 0.8 },
  { path: "/games", priority: 0.9 },
  { path: "/events", priority: 0.8 },
  { path: "/events/public", priority: 0.8 },
  { path: "/events/private", priority: 0.8 },
  { path: "/book", priority: 0.9 },
  { path: "/faq", priority: 0.7 },
];

interface GameItem {
  id: number;
  updated_at?: string;
}

interface EventItem {
  id: number;
  updated_at?: string;
}

async function fetchGames(): Promise<GameItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/games/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}

async function fetchEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/events/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["en", "ru"];
  const entries: MetadataRoute.Sitemap = [];

  // 1. Static routes
  for (const route of staticPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route.priority,
      });
    }
  }

  // 2. Dynamic game detail pages
  const games = await fetchGames();
  for (const game of games) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/games/${game.id}`,
        lastModified: game.updated_at ? new Date(game.updated_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    }
  }

  // 3. Dynamic event detail pages
  const events = await fetchEvents();
  for (const event of events) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/events/${event.id}`,
        lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
  }

  return entries;
}