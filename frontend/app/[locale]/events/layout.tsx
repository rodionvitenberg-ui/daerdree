import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventsHub" });
  return {
    title: "Events — Daerdree",
    description: `${t("publicDesc")} ${t("privateDesc")}`,
  };
}

export default async function EventsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRu = locale === "ru";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isRu ? "Главная" : "Home", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isRu ? "Мероприятия" : "Events", item: `${SITE_URL}/${locale}/events` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
