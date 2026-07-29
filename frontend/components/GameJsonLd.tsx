import { BoardGame } from "@/types/game";
import { getImageUrl } from "@/lib/utils";

interface GameJsonLdProps {
  game: BoardGame;
  locale: string;
  baseUrl: string;
}

export default function GameJsonLd({ game, locale, baseUrl }: GameJsonLdProps) {
  const title = locale === "ru" ? (game.title_ru || game.title) : (game.title_en || game.title);
  const description =
    locale === "ru"
      ? (game.description_ru || game.description || "")
      : (game.description_en || game.description || "");

  // Очищаем HTML-теги для Schema.org (допустим только plain text)
  const cleanDescription = description.replace(/<[^>]*>/g, "").slice(0, 5000);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: title,
    description: cleanDescription,
    url: `${baseUrl}/${locale}/games/${game.id}`,
    image: game.image
      ? getImageUrl(game.image)
      : game.setup_image
        ? getImageUrl(game.setup_image)
        : undefined,
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: game.min_players,
      maxValue: game.max_players,
    },
    ...(game.play_time && {
      gameplayTime: `PT${game.play_time}M`,
    }),
    ...(game.difficulty && {
      educationalLevel: [
        "Очень легко",
        "Легко",
        "Средне",
        "Сложно",
        "Хардкор",
      ][game.difficulty - 1] || undefined,
    }),
    ...(game.designer && {
      author: {
        "@type": "Person",
        name: game.designer,
      },
    }),
    ...(game.categories &&
      game.categories.length > 0 && {
        genre: game.categories.map((cat) =>
          locale === "ru" ? (cat.name_ru || cat.name) : (cat.name_en || cat.name)
        ),
      }),
    inLanguage: locale === "ru" ? "ru" : "en",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}