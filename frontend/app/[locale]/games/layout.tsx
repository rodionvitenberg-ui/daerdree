import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

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

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}