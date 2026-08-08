import { Manrope, Literata } from 'next/font/google';
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/footer';
import SmoothScroll from '@/components/SmoothScroll';
import ChunkRetryProvider from '@/components/ChunkRetryProvider';
import LocalBusinessJsonLd from '@/components/LocalBusinessJsonLd';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://daerdree.bar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

const literata = Literata({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-literata',
  display: 'swap',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isRu = locale === 'ru';

  const title = isRu
    ? 'Daerdree Bar & Timeclub — лучший бар и таймклуб на Кипре'
    : 'Daerdree Bar & Timeclub — Best Bar & Timeclub in Cyprus';

  const description = isRu
    ? 'Daerdree — атмосферный бар и таймклуб в Ларнаке, Кипр. Настольные игры, коктейли, мероприятия, кейтеринг и частные вечеринки.'
    : 'Daerdree — an atmospheric bar & timeclub in Larnaca, Cyprus. Board games, cocktails, events, catering, and private parties.';

  const siteName = 'Daerdree Bar & Timeclub';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ru: '/ru',
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName,
      locale: isRu ? 'ru_RU' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/images/hero/4.webp',
          width: 1200,
          height: 630,
          alt: 'Daerdree Bar & Timeclub',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/hero/4.webp'],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

export default async function RootLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    // Применяем переменную --font-literata
    <html lang={locale} className={`${manrope.variable} ${literata.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://daerdree.bar" />
        <link rel="preconnect" href="https://daerdree.bar" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/images/hero/4.webp" fetchPriority="high" />
      </head>
      <body className="antialiased bg-background text-foreground flex flex-col min-h-dvh overflow-x-clip">
        <NextIntlClientProvider messages={messages}>
          <ChunkRetryProvider>
            <SmoothScroll />
            <LocalBusinessJsonLd locale={locale} baseUrl={SITE_URL} />
            <Header />
            <main className="flex-grow min-w-0">
              {children}
            </main>
            <Footer />
          </ChunkRetryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}