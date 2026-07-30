import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardGame } from "@/types/game";

export const dynamic = 'force-dynamic';

import GameDetailsClient from "./GameDetailsClient";

async function getGame(id: string, locale: string): Promise<BoardGame | null> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${API_BASE}/api/games/${id}/`, {
      next: { revalidate: 3600 },
      headers: {
        'Accept-Language': locale,
      }
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const locale = 'ru'; // fallback for metadata
  const game = await getGame(id, locale);

  if (!game) {
    return {
      title: 'Game — Daerdree',
      description: 'Board game at Daerdree Bar & Timeclub',
    };
  }

  const localizedTitle = locale === 'ru' ? (game.title_ru || game.title) : (game.title_en || game.title);
  const localizedDescription = locale === 'ru' ? (game.description_ru || game.description) : (game.description_en || game.description);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://daerdree.bar';
  const cleanDesc = (localizedDescription || '').replace(/<[^>]*>/g, '').slice(0, 160);

  return {
    title: `${localizedTitle} — Daerdree`,
    description: cleanDesc || `${localizedTitle} at Daerdree Bar & Timeclub`,
    alternates: {
      canonical: `/${locale}/games/${id}`,
      languages: {
        en: `/en/games/${id}`,
        ru: `/ru/games/${id}`,
      },
    },
    openGraph: {
      title: `${localizedTitle} — Daerdree`,
      description: cleanDesc || '',
      url: `${baseUrl}/${locale}/games/${id}`,
      type: 'website',
      images: game.image ? [{ url: `${baseUrl}/media/${game.image}`, width: 800, height: 600, alt: localizedTitle }] : [],
    },
  };
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams?: Promise<any> }) {
  const { id } = await params;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  let gameData: BoardGame | null = null;

  // Fetch data server-side for SSR
  try {
    const res = await fetch(`${API_BASE}/api/games/${id}/`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      gameData = await res.json();
    }
  } catch {}

  if (!gameData) {
    notFound();
  }

  return <GameDetailsClient game={gameData} />;
}