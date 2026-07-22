import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventsPublic" });
  return {
    title: `${t("heroTitle")} — Daerdree`,
    description: t("heroSubtitle"),
  };
}

export default function EventsPublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}