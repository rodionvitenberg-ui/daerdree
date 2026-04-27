import { Manrope } from 'next/font/google';
import localFont from 'next/font/local';
import "./globals.css";
import Header from '@/components/Header';
import Footer from '@/components/footer';
// Импортируем компоненты для локализации
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

const zodiak = localFont({
  src: [
    {
      path: '../../public/fonts/Zodiak-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Zodiak-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-zodiak',
  display: 'swap',
});

export const metadata = {
  title: 'Daerdree Bar & Timeclub',
  description: 'Best bar and timeclub in Cyprus',
}

// Делаем RootLayout асинхронным и принимаем params как Promise
export default async function RootLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // В Next.js 15+ параметры нужно обязательно await
  const { locale } = await params;
  
  // Получаем словарь переводов для текущей локали
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${manrope.variable} ${zodiak.variable}`}>
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        
        {/* Оборачиваем содержимое в провайдер. 
            Теперь хук useTranslations будет иметь доступ к сообщениям на клиенте. */}
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