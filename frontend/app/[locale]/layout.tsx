import { Manrope } from 'next/font/google';
import localFont from 'next/font/local';
import "./globals.css";
import Header from '@/components/Header'; // <--- Импорт (проверь путь!)

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

// Добавим метаданные для SEO (базовые)
export const metadata = {
  title: 'Daerdree Bar & Timeclub',
  description: 'Best bar and timeclub in Cyprus',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${zodiak.variable}`}>
      <body className="antialiased bg-background text-foreground flex flex-col min-h-screen">
        
        {/* Вставляем Хедер сюда */}
        <Header />
        
        <main className="flex-grow">
          {children}
        </main>

      </body>
    </html>
  );
}