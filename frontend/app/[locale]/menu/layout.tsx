import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MenuPage" });
  return {
    title: `${t("title")} — Daerdree`,
    description: t("subtitle"),
  };
}

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRu = locale === "ru";

  const menuJsonLd = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: isRu ? "Меню Daerdree Bar & Timeclub" : "Daerdree Bar & Timeclub Menu",
    description: isRu
      ? "Крафтовые коктейли, вино, закуски и основные блюда в баре Daerdree, Ларнака, Кипр."
      : "Craft cocktails, wine, snacks and main dishes at Daerdree bar, Larnaca, Cyprus.",
    inLanguage: locale === "ru" ? "ru" : "en",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: isRu ? "Кофе" : "Coffee",
        description: isRu ? "Классика, холодные и молочные напитки" : "Classics, cold and milk-based drinks",
      },
      {
        "@type": "MenuSection",
        name: isRu ? "Чай" : "Tea",
        description: isRu ? "Чайник 300 мл" : "300 ml tea pot",
      },
      {
        "@type": "MenuSection",
        name: isRu ? "Коктейли" : "Cocktails",
        description: isRu ? "Авторские и классические коктейли" : "Signature and classic cocktails",
      },
      {
        "@type": "MenuSection",
        name: isRu ? "Пиво" : "Beer",
        description: isRu ? "Светлые и тёмные сорта" : "Light and dark beer",
      },
      {
        "@type": "MenuSection",
        name: isRu ? "Вино" : "Wine",
        description: isRu ? "По бокалам и бутылкам" : "By the glass and bottle",
      },
      {
        "@type": "MenuSection",
        name: isRu ? "Крепкие напитки" : "Strong Spirits",
        description: isRu ? "Шоты на выбор" : "A selection of shots",
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isRu ? "Главная" : "Home", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isRu ? "Меню" : "Menu", item: `${SITE_URL}/${locale}/menu` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
