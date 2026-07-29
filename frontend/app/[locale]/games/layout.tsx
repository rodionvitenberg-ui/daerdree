import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "ru") {
    return {
      title: "Настольные игры на Кипре — Daerdree Bar & Timeclub",
      description: "Daerdree — бар с настольными играми в Ларнаке, Кипр. Более 50 настолок: от классики до современных хитов. Уютный зал, крафтовые коктейли и тёплая компания каждый вечер.",
    };
  }
  return {
    title: "Board Games in Cyprus — Daerdree Bar & Timeclub",
    description: "Daerdree — board game bar in Larnaca, Cyprus. Over 50 board games from classics to modern hits. Cozy atmosphere, craft cocktails, and great company every evening.",
  };
}

interface GameFromApi {
  id: number;
  title: string;
  title_ru?: string | null;
  title_en?: string | null;
  description: string;
  description_ru?: string | null;
  description_en?: string | null;
}

async function fetchAllGames(): Promise<GameFromApi[]> {
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

export default async function GamesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const games = await fetchAllGames();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "ru" ? "Главная" : "Home", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "ru" ? "Настольные игры" : "Board Games", item: `${SITE_URL}/${locale}/games` },
    ],
  };

  const itemListJsonLd = games.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: locale === "ru" ? "Настольные игры в Daerdree" : "Board Games at Daerdree",
        itemListElement: games.map((game, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Game",
            name: locale === "ru" ? (game.title_ru || game.title) : (game.title_en || game.title),
            url: `${SITE_URL}/${locale}/games/${game.id}`,
            description: (locale === "ru" ? (game.description_ru || game.description) : (game.description_en || game.description)).slice(0, 300),
          },
        })),
      }
    : null;

  // FAQPage structured data for games FAQ (mirrors seo-content.tsx)
  const isRu = locale === "ru";
  const gamesFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: isRu ? "Какие настольные игры есть в Daerdree?" : "What board games does Daerdree have?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isRu
            ? "У нас более 50 настольных игр: от классических (Монополия, Уно, Шахматы) до стратегических хитов (Колонизаторы, Каркассон, Эпические схватки). Мы постоянно обновляем ассортимент."
            : "We have over 50 board games: from classics (Monopoly, Uno, Chess) to strategic hits (Settlers of Catan, Carcassonne, Epic Battles). We regularly update our collection.",
        },
      },
      {
        "@type": "Question",
        name: isRu ? "Сколько стоит поиграть в настольные игры?" : "How much does it cost to play board games?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isRu
            ? "Игры бесплатны для посетителей бара. Вы заказываете напитки и закуски — а играете без дополнительной платы. Никаких скрытых сборов."
            : "Board games are free for bar guests. You order drinks and snacks — and play without any extra charge. No hidden fees.",
        },
      },
      {
        "@type": "Question",
        name: isRu ? "Нужно ли бронировать стол для игр?" : "Do I need to reserve a table for games?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isRu
            ? "Рекомендуем бронировать на вечер пятницы и выходные. В будни обычно есть свободные столы. Бронь можно оформить на нашем сайте в разделе «Бронь»."
            : "We recommend booking for Friday and Saturday evenings. Weekdays are usually fine. You can book directly on our website in the \"Book\" section.",
        },
      },
      {
        "@type": "Question",
        name: isRu ? "Подходит ли бар для новичков?" : "Is Daerdree suitable for beginners?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isRu
            ? "Да! Мы подбираем игру под уровень компании. Для новичков у нас есть простые и весёлые игры, а для опытных — сложные стратегии. Наш персонал всегда поможет с правилами."
            : "Yes! We match games to your group's experience level. Beginners get easy fun games, while experts can dive into complex strategies. Our staff will help with the rules.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gamesFaqJsonLd) }}
      />
      {children}
    </>
  );
}
