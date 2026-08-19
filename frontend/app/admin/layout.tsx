import { Manrope, Literata } from 'next/font/google';
import '../[locale]/globals.css';
import './admin.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const literata = Literata({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600'], variable: '--font-literata', display: 'swap' });

export const metadata = { title: 'Daerdree Admin', robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${literata.variable} admin-root`}>{children}</body>
    </html>
  );
}
