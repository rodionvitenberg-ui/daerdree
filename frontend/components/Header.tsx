"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Aurora from './Aurora';

const NAV_ITEMS = [
  { key: 'menu', href: '/menu', group: 'left' },
  { key: 'games', href: '/games', group: 'left' },
  { key: 'events', href: '/events', group: 'right' },
  { key: 'booking', href: '/book', group: 'right' },
  { key: 'faq', href: '/faq', group: 'right' },
];

export default function Header() {
  const t = useTranslations('Header.nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lastScrollY = useRef(0);

  // === ЛОГИКА СКРЫТИЯ ХЕДЕРА ===
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

  // Prefer reduced motion + skip heavy WebGL on coarse/touch mobile
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Lock body scroll while mobile nav is open
  useEffect(() => {
    document.body.classList.toggle('nav-open', isOpen);
    return () => document.body.classList.remove('nav-open');
  }, [isOpen]);

  // Escape closes mobile menu
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // === ЛОГИКА СМЕНЫ ЯЗЫКА ===
  const toggleLanguage = () => {
    setIsOpen(false);
    const nextLocale = locale === 'ru' ? 'en' : 'ru';
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${nextLocale}`);
    router.replace(newPath);
  };
  // ==========================

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md relative transition-transform duration-300 ease-in-out pt-[var(--safe-top)]
        ${isVisible ? 'translate-y-0' : 'md:-translate-y-full'}
      `}
    >
      
      {/* --- ЭФФЕКТ AURORA (desktop only — WebGL is costly on mobile Safari) --- */}
      {!reduceMotion && (
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none overflow-hidden hidden md:block">
           <Aurora
             colorStops={["#116880", "#ffffff", "#5f1132"]} 
             blend={0.5}
             amplitude={1.0}
             speed={0.5}
           />
        </div>
      )}
      
      <nav className="mx-auto flex min-h-[var(--header-height)] items-center justify-between px-4 py-1 md:grid md:max-w-[1440px] md:grid-cols-[1fr_auto_1fr] md:px-8">
        
        {/* --- 1. МОБИЛЬНЫЙ ЛОГОТИП --- */}
        <div className="flex md:hidden">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex min-h-11 min-w-11 items-center">
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
              key={item.key}
              href={item.href} 
              className="font-serif text-sm font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)}
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
              key={item.key}
              href={item.href} 
              className="font-serif text-sm font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)}
            </Link>
          ))}
          
          <button 
            onClick={toggleLanguage} 
            className="font-serif text-sm font-bold uppercase tracking-widest text-foreground/50 transition-colors duration-500 ease-in-out hover:text-accent"
            aria-label="Toggle language"
          >
            {locale === 'ru' ? 'EN' : 'RU'}
          </button>
        </div>

        {/* --- 5. ПРАВАЯ ЧАСТЬ МОБИЛКИ (Бургер + Язык) --- */}
        <div className="flex items-center gap-2 md:hidden">
          
          <button 
            onClick={toggleLanguage} 
            className="flex min-h-11 min-w-11 items-center justify-center font-serif text-sm font-bold uppercase tracking-widest text-foreground/50 hover:text-accent transition-colors"
            aria-label="Toggle language"
          >
            {locale === 'ru' ? 'EN' : 'RU'}
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-11 w-11 items-center justify-center text-foreground transition-colors duration-300 hover:text-accent"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
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
        className={`absolute left-0 top-full -mt-px w-full bg-background/95 backdrop-blur-xl transition-all duration-500 ease-in-out md:hidden overflow-y-auto overscroll-contain
          ${isOpen ? 'max-h-[min(70dvh,28rem)] py-8 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}
        `}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col items-center gap-2 pb-[var(--safe-bottom)] text-center">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.key}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 w-full items-center justify-center px-4 font-serif text-lg font-bold uppercase tracking-widest text-foreground transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
      </div>

    </header>
  );
}