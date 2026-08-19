"use client";

import { useState, useEffect, useRef } from 'react';
import Image from '@/components/AppImage';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import Aurora from './Aurora';

const NAV_ITEMS = [
  { key: 'menu', href: '/menu', group: 'left' },
  { key: 'games', href: '/games', group: 'left' },
  { key: 'events', href: '/events', group: 'right' },
  { key: 'booking', href: '/book', group: 'right' },
  { key: 'faq', href: '/faq', group: 'right' },
];

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

export default function Header() {
  const t = useTranslations('Header.nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const desktopLangRef = useRef<HTMLDivElement>(null);
  const mobileLangRef = useRef<HTMLDivElement>(null);

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

  // Escape closes mobile nav + language dropdown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setLangOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopLangRef.current?.contains(target);
      const insideMobile = mobileLangRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [langOpen]);

  const switchTo = (nextLocale: string) => {
    setLangOpen(false);
    setIsOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md pt-[var(--safe-top)]"
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

      <nav className="mx-auto flex min-h-[56px] items-center justify-between px-[16px] py-[4px] md:grid md:max-w-[1440px] md:grid-cols-[1fr_auto_1fr] md:px-[32px]">

        {/* --- 1. МОБИЛЬНЫЙ ЛОГОТИП --- */}
        <div className="flex md:hidden">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex min-h-[44px] min-w-[44px] items-center">
            <Image
              src="/images/daerdree.png"
              alt="Daerdree Logo"
              width={75}
              height={32}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* --- 2. ЛЕВАЯ ЧАСТЬ (Desktop) --- */}
        <div className="hidden w-full items-center justify-start gap-[32px] md:flex md:justify-self-start">
          {NAV_ITEMS.filter(i => i.group === 'left').map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="font-serif text-[14px] font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
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
              width={160}
              height={77}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* --- 4. ПРАВАЯ ЧАСТЬ (Desktop) --- */}
        <div className="hidden w-full items-center justify-end gap-[32px] md:flex md:justify-self-end">
          {NAV_ITEMS.filter(i => i.group === 'right').map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="font-serif text-[14px] font-bold uppercase tracking-widest text-foreground/80 transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)}
            </Link>
          ))}

          {/* Языковой dropdown (desktop) */}
          <div className="relative" ref={desktopLangRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="font-serif text-[14px] font-bold uppercase tracking-widest text-foreground/50 transition-colors duration-500 ease-in-out hover:text-accent"
              aria-label="Select language"
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              {locale.toUpperCase()}
            </button>
            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-[8px] min-w-[88px] overflow-hidden rounded-md border border-white/10 bg-background/95 py-[4px] shadow-xl backdrop-blur-xl"
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    role="menuitem"
                    onClick={() => switchTo(lang.code)}
                    className={`flex w-full items-center justify-center px-[16px] py-[8px] font-serif text-[14px] font-bold uppercase tracking-widest transition-colors duration-500 ease-in-out hover:text-accent ${
                      lang.code === locale ? 'text-accent' : 'text-foreground/50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- 5. ПРАВАЯ ЧАСТЬ МОБИЛКИ (Бургер + Язык) --- */}
        <div className="flex items-center gap-[8px] md:hidden">

          {/* Языковой dropdown (mobile) */}
          <div className="relative" ref={mobileLangRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center font-serif text-[14px] font-bold uppercase tracking-widest text-foreground/50 hover:text-accent transition-colors"
              aria-label="Select language"
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              {locale.toUpperCase()}
            </button>
            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-[8px] min-w-[88px] overflow-hidden rounded-md border border-white/10 bg-background/95 py-[4px] shadow-xl backdrop-blur-xl"
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    role="menuitem"
                    onClick={() => switchTo(lang.code)}
                    className={`flex w-full items-center justify-center px-[16px] py-[8px] font-serif text-[14px] font-bold uppercase tracking-widest transition-colors duration-500 ease-in-out hover:text-accent ${
                      lang.code === locale ? 'text-accent' : 'text-foreground/50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-[44px] w-[44px] items-center justify-center text-foreground transition-colors duration-300 hover:text-accent"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[32px] h-[32px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[32px] h-[32px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

      </nav>

      {/* --- ВЫДВИГАЮЩЕЕСЯ МЕНЮ --- */}
      {/* absolute top-full внутри sticky-хедера: прилипает сразу под строкой
          хедера и всегда остаётся в видимой области, не перекрывая сам хедер. */}
      <div
        id="mobile-nav"
        className={`absolute left-0 right-0 top-full md:hidden overflow-y-auto overscroll-contain bg-background/95 backdrop-blur-xl transition-all duration-500 ease-in-out
          ${isOpen ? 'max-h-[min(70dvh,448px)] py-[32px] opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}
        `}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex flex-col items-center gap-[8px] pb-[var(--safe-bottom)] text-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex min-h-[44px] w-full items-center justify-center px-[16px] font-serif text-[18px] font-bold uppercase tracking-widest text-foreground transition-colors duration-500 ease-in-out hover:text-accent"
            >
              {t(item.key)}
            </Link>
          ))}
        </div>
      </div>

    </header>
  );
}