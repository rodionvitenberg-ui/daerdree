"use client";

import Image from "next/image";
import Link from "next/link";
import AnimatedContent from "./AnimatedContent";
import { MENU_CONTENT } from "@/content/home";
import { useTranslations } from "next-intl";

export default function MenuTeaser() {
  const t = useTranslations("MenuTeaser");

  return (
    <section className="relative w-full overflow-hidden bg-background py-20 md:min-h-dvh md:py-0">
      
      {/* ==============================
          1. ФОНОВЫЙ ДРАКОН (MOBILE)
         ============================== */}
      <div className="absolute inset-0 z-0 opacity-20 md:hidden">
        <Image
          src={MENU_CONTENT.imageMobile} 
          alt={t("altBackground")} 
          fill
          className="object-cover object-[center_20px]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="container mx-auto flex h-full flex-col items-center md:min-h-dvh md:flex-row md:justify-center md:gap-16">
        <div className="hidden md:block relative w-[400px] h-[600px] lg:w-[500px] lg:h-[800px] shrink-0 transition-transform duration-700">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600%] h-[20%] bg-accent/10 blur-[80px] rounded-full" />
          
          <Image
            src={MENU_CONTENT.imageDesktop} 
            alt={t("altDragon")}
            fill
            className="object-contain drop-shadow-2xl" 
            priority 
            sizes="(max-width: 1024px) 400px, 500px"
          />
        </div>

        {/* ==============================
            3. ТЕКСТОВАЯ ЧАСТЬ
           ============================== */}
        <div className="relative z-10 flex h-full flex-col justify-center px-4 text-center md:max-w-xl">
          
          <div className="flex flex-col gap-6">
            
            <AnimatedContent
              distance={150}
              direction="vertical"
              reverse={false}
              duration={1.0}
              ease="ease.out"
              initialOpacity={0}
              animateOpacity
              threshold={0.1}
            >
              <h2 className="font-serif text-4xl font-bold uppercase tracking-widest text-foreground md:text-6xl lg:text-7xl text-balance">
                {t("title")}
                <span className="text-accent">{t("highlightWord")}</span>
              </h2>
            </AnimatedContent>

            <AnimatedContent
              distance={200}
              direction="vertical"
              reverse={false}
              duration={1.2}
              delay={0.2}
              ease="ease.out"
              initialOpacity={0}
              animateOpacity
              threshold={0.1}
            >
              <p className="font-sans text-lg leading-relaxed text-foreground/80 md:text-xl text-pretty">
                {t("description")}
              </p>
            </AnimatedContent>

            <div className="mt-8 flex justify-center w-full">
              <Link href="/menu">
                <button className="group relative min-h-11 overflow-hidden px-10 py-4 md:px-8 md:py-3 border border-accent transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
                  <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-secondary text-sm md:text-base">
                    {t("buttonText")}
                  </span>
                </button>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
