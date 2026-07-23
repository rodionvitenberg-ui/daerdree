import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivateEvents" });
  return {
    title: `${t("hero.title")} — Daerdree`,
    description: t("hero.description"),
  };
}

export default function EventsPrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}