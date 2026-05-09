import { Manrope, Literata } from 'next/font/google'; // Импортируем Literata
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/footer';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

// Настраиваем Literata
const literata = Literata({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'], // Обязательно укажи нужные веса
  variable: '--font-literata',   // Имя переменной
  display: 'swap',
});

export const metadata = {
  title: 'Daerdree Bar & Timeclub',
  description: 'Best bar and timeclub in Cyprus',
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