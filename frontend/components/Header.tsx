"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Aurora from './Aurora';
import { useTranslations } from 'next-intl'; // Подключили хук

// Заменили 'name' на 'key' для привязки к словарю переводов
const NAV_ITEMS = [
  { key: 'menu', href: '/menu', group: 'left' },
  { key: 'games', href: '/games', group: 'left' },
  { key: 'events', href: '/events', group: 'right' },
  { key: 'booking', href: '/book', group: 'right' },
  { key: 'faq', href: '/faq', group: 'right' },
];

export default function Header() {
  const t = useTranslations('Header.nav'); // Инициализировали переводы
  const [isOpen, setIsOpen] = useState(false);
  
  // === ЛОГИКА СКРЫТИЯ ХЕДЕРА ===
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // =============================

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md relative transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : 'md:-translate-y-full'}
      `}
    >
      
      {/* --- ЭФФЕКТ AURORA --- */}
      <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none overflow-hidden">
         <Aurora
           colorStops={["#116880", "#ffffff", "#5f1132"]} 
           blend={0.5}
           amplitude={1.0}
           speed={0.5}
         />
      </div>
      
      <nav className="mx-auto flex items-center justify-between px-4 py-1 md:grid md:max-w-[1440px] md:grid-cols-[1fr_auto_1fr] md:px-8">
        
        {/* --- 1. МОБИЛЬНЫЙ ЛОГОТИП --- */}
        <div className="flex md:hidden">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Image 
                src="/images/logo.png" 
                alt="Daerdree Logo" 
                width={50} 
                height={25} 
                className="object-contain"
                priority
              />
            </Link>
        </div>

        {/* --- 2. ЛЕВАЯ ЧАСТЬ (Desktop) --- */}
        <div className="hidden w-full items-center justify-start gap-8 md:flex md:justify-self-start">
          {NAV_ITEMS.filter(i => i.group === 'left').map((item) => (
            <Link 
              key={item.key} // Используем key
              href={item.href} 
              className="font-serif text-sm font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)} {/* Выводим локализованный текст */}
            </Link>
          ))}
        </div>

        {/* --- 3. ЦЕНТРАЛЬНЫЙ ЛОГОТИП (Desktop) --- */}
        <div className="hidden justify-center md:flex">
          <Link href="/" className="transition-transform duration-500 scale-90">
            <Image 
              src="/images/logo.png" 
              alt="Daerdree Logo" 
              width={90} 
              height={45}
              className="object-contain"
              priority 
            />
          </Link>
        </div>

        {/* --- 4. ПРАВАЯ ЧАСТЬ (Desktop) --- */}
        <div className="hidden w-full items-center justify-end gap-8 md:flex md:justify-self-end">
           {NAV_ITEMS.filter(i => i.group === 'right').map((item) => (
            <Link 
              key={item.key} // Используем key
              href={item.href} 
              className="font-serif text-sm font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)} {/* Выводим локализованный текст */}
            </Link>
          ))}
        </div>

        {/* --- 5. БУРГЕР --- */}
        <div className="flex md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center text-foreground transition-colors duration-300 hover:text-accent"
            aria-label="Toggle menu"
          >
            {isOpen ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
               </svg>
            )}
          </button>
        </div>

      </nav>

      {/* --- ВЫДВИГАЮЩЕЕСЯ МЕНЮ --- */}
      <div 
        className={`absolute left-0 top-full -mt-px w-full bg-background/95 backdrop-blur-xl transition-all duration-500 ease-in-out md:hidden overflow-hidden
          ${isOpen ? 'max-h-[45vh] py-8 opacity-100' : 'max-h-0 py-0 opacity-0'}
        `}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.key} // Используем key
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="font-serif text-lg font-bold uppercase tracking-widest text-foreground transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)} {/* Выводим локализованный текст */}
            </Link>
          ))}
        </div>
      </div>

    </header>
  );
}