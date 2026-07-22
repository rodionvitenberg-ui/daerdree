import { Manrope, Literata } from 'next/font/google';
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/footer';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://daerdree.bar';

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
          url: '/images/og-image.jpg',
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
      images: ['/images/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
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
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}