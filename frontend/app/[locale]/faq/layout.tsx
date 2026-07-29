import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://daerdree.bar";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });
  const isRu = locale === "ru";
  return {
    title: `${t("title_1")} ${t("title_2")} ${t("title_3")} — Daerdree`,
    description: isRu
      ? "Ответы на часто задаваемые вопросы о баре Daerdree в Ларнаке: бронирование, настольные игры, коктейли, частные мероприятия и кейтеринг на Кипре."
      : "Frequently asked questions about Daerdree Bar in Larnaca: reservations, board games, cocktails, private events, and catering in Cyprus.",
  };
}

interface RawFAQItem {
  question?: string;
  answer: string | string[];
  list?: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\{.*?\}/g, "").trim();
}

function answerToPlainText(answer: string | string[]): string {
  if (Array.isArray(answer)) return answer.map((p) => stripHtml(p)).join(" ");
  return stripHtml(answer);
}

export default async function FAQLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });

  // Build FAQPage structured data from the same translation blocks
  const blockIds = [
    "payment-rules",
    "rent-games",
    "private-events",
    "new-players",
    "solo-specific",
    "hours-pets",
  ];

  const faqEntries: { "@type": "Question"; name: string; acceptedAnswer: { "@type": "Answer"; text: string } }[] = [];

  for (const blockId of blockIds) {
    try {
      const items = t.raw(`blocks.${blockId}.items`) as RawFAQItem[];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item.question && item.answer) {
          faqEntries.push({
            "@type": "Question",
            name: stripHtml(item.question),
            acceptedAnswer: {
              "@type": "Answer",
              text: answerToPlainText(item.answer),
            },
          });
        }
      }
    } catch {
      // Skip blocks that don't have translatable items
    }
  }

  const faqJsonLd = faqEntries.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries,
      }
    : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
