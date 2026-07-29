interface LocalBusinessJsonLdProps {
  locale: string;
  baseUrl: string;
}

export default function LocalBusinessJsonLd({ locale, baseUrl }: LocalBusinessJsonLdProps) {
  const isRu = locale === "ru";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${baseUrl}/#organization`,
    name: "Daerdree Bar & Timeclub",
    description: isRu
      ? "Атмосферный бар и таймклуб в Ларнаке, Кипр. Настольные игры, коктейли, мероприятия, кейтеринг и частные вечеринки."
      : "Atmospheric bar & timeclub in Larnaca, Cyprus. Board games, cocktails, events, catering, and private parties.",
    url: `${baseUrl}/${locale}`,
    telephone: "+357 99 326660",
    email: "daerdree@gmail.com",
    logo: `${baseUrl}/images/daerdree.png`,
    image: `${baseUrl}/images/hero/4.webp`,
    sameAs: [
      "https://www.instagram.com/daerdree.bar",
      "https://t.me/daerdreebar",
    ],
    servesCuisine: "Cocktail Bar",
    priceRange: "€€",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        opens: "15:00",
        closes: "23:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday"],
        opens: "15:00",
        closes: "01:00",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nikolaou Rossou 1",
      addressLocality: "Larnaca",
      addressCountry: "CY",
      postalCode: "6020",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 34.9081376,
      longitude: 33.6287453,
    },
    languages: ["ru", "en"],
    servesAlcohol: true,
    hasTV: false,
    smokingAllowed: false,
    menu: `${baseUrl}/${locale}/menu`,
    acceptsReservations: true,
    paymentAccepted: "Cash, Credit Card",
    ...(isRu
      ? {}
      : {
          alternateName: "Даэрдри",
          additionalType: "https://schema.org/EntertainmentBusiness",
        }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}