import Hero from "@/components/Hero";
import Booking from "@/components/Booking";
import GamesMarquee from "@/components/GameMarquee";
import MenuTeaser from "@/components/MenuTeaser";
import ParallaxDivider from "@/components/ParallaxDivider";
import EventMasonry from "@/components/EventMasonry";
import CateringStory from "@/components/CateringStory";
import LocationSection from "@/components/LocationSection";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const locale = await getLocale();
  const isRu = locale === "ru";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: "Daerdree Bar & Timeclub",
    description: isRu
      ? "Атмосферный бар и таймклуб в Ларнаке, Кипр. Настольные игры, коктейли, мероприятия, кейтеринг, частные вечеринки."
      : "Atmospheric bar & timeclub in Larnaca, Cyprus. Board games, cocktails, events, catering, private parties.",
    url: "https://daerdree.bar",
    email: "mail@daerdree.bar",
    telephone: "+357 95 147376",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nikolaou Rossou 1",
      addressLocality: "Larnaca",
      addressCountry: "CY",
    },
    sameAs: [
      "https://instagram.com/daerdree",
      "https://t.me/daerdreedm",
    ],
    servesCuisine: "Bar",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
      ],
      opens: "17:00",
      closes: "02:00",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 34.9081376,
      longitude: 33.6287453,
    },
  };

  return (
    <div className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Booking />
      <CateringStory />
      <ParallaxDivider />
      <GamesMarquee />
      <MenuTeaser />
      <EventMasonry />
      <LocationSection /> 
    </div>
  );
}
