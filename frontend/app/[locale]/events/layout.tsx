import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventsHub" });
  return {
    title: "Events — Daerdree",
    description: `${t("publicDesc")} ${t("privateDesc")}`,
  };
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}