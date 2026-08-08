"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedContent from "@/components/AnimatedContent";
import { useTranslations } from "next-intl";

export default function EventsHub() {
  const t = useTranslations("EventsHub");

  return (
    <div className="h-app-minus-header w-full flex flex-col lg:flex-row bg-black overflow-hidden">
      
      {/* === ЛЕВАЯ СТОРОНА: PUBLIC EVENTS === */}
      <Link href="/events/public" className="group relative flex-1 min-h-0 h-1/2 lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/4.webp"
            alt="Public Events"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-8 lg:p-16 items-start">
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.8}
            delay={0.1}
            threshold={0.2}
            className="mb-0"
          >
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-3 lg:mb-4 block">
              {t("publicSub")}
            </span>
          </AnimatedContent>
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.8}
            delay={0.2}
            threshold={0.2}
            className="mb-0"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl font-black text-white uppercase tracking-widest mb-3 lg:mb-6 group-hover:text-accent transition-colors text-balance">
              {t("publicTitle1")}<br/>{t("publicTitle2")}
            </h2>
          </AnimatedContent>
          {/* Always visible on touch; hover-reveal only on devices that support hover */}
          <p className="text-white max-w-md text-sm lg:text-lg mb-4 lg:mb-8 opacity-90 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-500 [@media(hover:hover)]:translate-y-4 [@media(hover:hover)]:group-hover:translate-y-0">
            {t("publicDesc")}
          </p>

          <div className="relative overflow-hidden px-8 py-4 sm:px-10 sm:py-5 lg:px-8 lg:py-4 transition-all duration-300 flex-shrink-0 flex items-center justify-center min-h-11">
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent opacity-100 lg:opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100" />
            
            <div className="absolute inset-0 border border-white/30 opacity-0 lg:opacity-100 transition-opacity duration-300 lg:group-hover:opacity-0" />
            
            <span className="relative z-10 font-serif text-xs font-bold uppercase tracking-widest text-black lg:text-white transition-colors duration-300 lg:group-hover:text-black">
              {t("publicBtn")}
            </span>
          </div>

        </div>
      </Link>

      {/* === ПРАВАЯ СТОРОНА: PRIVATE HIRE === */}
      <Link href="/events/private" className="group relative flex-1 min-h-0 h-1/2 lg:h-full overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
          <Image
            src="/images/hero/7.webp"
            alt="Private Hire"
            fill
            className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center p-6 sm:p-8 lg:p-16 items-end text-right">
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.8}
            delay={0.1}
            threshold={0.2}
            className="mb-0"
          >
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-3 lg:mb-4 block">
              {t("privateSub")}
            </span>
          </AnimatedContent>
          <AnimatedContent
            distance={20}
            direction="vertical"
            duration={0.8}
            delay={0.2}
            threshold={0.2}
            className="mb-0"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl font-black text-white uppercase tracking-widest mb-3 lg:mb-6 group-hover:text-accent transition-colors text-balance">
              {t("privateTitle1")}<br/>{t("privateTitle2")}
            </h2>
          </AnimatedContent>
          <p className="text-white max-w-md text-sm lg:text-lg mb-4 lg:mb-8 opacity-90 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-500 [@media(hover:hover)]:translate-y-4 [@media(hover:hover)]:group-hover:translate-y-0">
            {t("privateDesc")}
          </p>
          
          <div className="relative overflow-hidden px-8 py-4 sm:px-10 sm:py-5 lg:px-8 lg:py-4 transition-all duration-300 flex-shrink-0 flex items-center justify-center min-h-11">
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent opacity-100 lg:opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100" />
            
            <div className="absolute inset-0 border border-white/30 opacity-0 lg:opacity-100 transition-opacity duration-300 lg:group-hover:opacity-0" />
            
            <span className="relative z-10 font-serif text-xs font-bold uppercase tracking-widest text-black lg:text-white transition-colors duration-300 lg:group-hover:text-black">
              {t("privateBtn")}
            </span>
          </div>

        </div>
      </Link>

    </div>
  );
}
