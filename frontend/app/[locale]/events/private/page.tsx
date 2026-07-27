"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AnimatedContent from "@/components/AnimatedContent";
import DimensionalImageStack from "@/components/DimensionalImageStack";
import { PRIVATE_HIRE_CONTENT } from "@/content/privateevents";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export default function PrivateHirePage() {
  const t = useTranslations("PrivateEvents"); // <-- Инициализация переводов

  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaImageRef = useRef<HTMLImageElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = ctaContainerRef.current;
    const image = ctaImageRef.current;
    const content = ctaContentRef.current;

    if (!container || !image || !content) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        image,
        { yPercent: -30 },
        {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      gsap.fromTo(
        content,
        { y: -50, opacity: 0 },
        {
          y: 50,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "center center",
            scrub: true,
          },
        }
      );
    }, ctaContainerRef);

    return () => ctx.revert();
  }, []);


  // Получаем массив особенностей из JSON для рендеринга
  const gameMasterFeatures = t.raw("gameMaster.features") as string[];

  return (
    <div className="bg-neutral-950 min-h-dvh text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-dvh flex items-center justify-center pb-16 md:pb-0">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={PRIVATE_HIRE_CONTENT.hero.image}
            alt="Private Event Atmosphere"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b via-transparent to-neutral-950" />
        
        <div className="relative z-10 text-center px-4">
          <Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-secondary/30 hover:text-secondary transition-colors mb-6">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span>{t("back")}</span>
          </Link>
          <AnimatedContent direction="vertical">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-widest text-secondary mb-4">
              {t("hero.title")}
            </h1>
            <p className="font-sans text-lg md:text-2xl text-secondary/80 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
              {t("hero.description")}
            </p>
          </AnimatedContent>
          
          <div className="mt-12">
            <Link 
              href="/book"
              className="group relative mt-4 inline-flex min-h-11 min-w-[11rem] items-center justify-center overflow-hidden px-8 py-4 transition-all duration-300"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80 border border-accent/50" />
                <div className="absolute inset-0 bg-accent transition-opacity duration-500 group-hover:opacity-0" />
                <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-[#F7F0EA]">
                    {t("hero.buttonText")}
                </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE GAME MASTER */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            
            <div className="w-full md:w-1/2 relative z-10">
                <DimensionalImageStack
                  images={PRIVATE_HIRE_CONTENT.gameMaster.images}
                  containerHeight={450}
                  className="py-4"
                />
            </div>
            
            <div className="md:w-1/2 relative z-20">
                <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
                  {t("gameMaster.subtitle")}
                </span>
                <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
                   {t("gameMaster.title")}
                </h2>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                   {t("gameMaster.description")}
                </p>
                <ul className="space-y-2 text-white/80 font-serif uppercase text-sm tracking-widest">
                    {gameMasterFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-accent">•</span> {feature}
                      </li>
                    ))}
                </ul>
                <p className="text-white/80 text-lg leading-relaxed mt-6">
                   {t("gameMaster.subDescription")}
                </p>
            </div>
        </div>
      </section>

      {/* 3. THE FEAST */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
             
             <div className="w-full md:w-1/2 relative z-10">
                <DimensionalImageStack
                  images={PRIVATE_HIRE_CONTENT.feast.images}
                  containerHeight={450}
                  className="py-4"
                />
            </div>

            <div className="md:w-1/2 relative z-20">
                <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
                  {t("feast.subtitle")}
                </span>
                <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
                  {t("feast.title")}
                </h2>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  {t("feast.descriptionOne")}
                </p>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  {t("feast.descriptionTwo")}
                </p>
                <p className="text-white/80 text-lg mb-6 leading-relaxed">
                  {t("feast.descriptionThree")}
                </p>
            </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section 
        ref={ctaContainerRef}
        className="relative h-[60dvh] min-h-[500px] flex items-center justify-center overflow-hidden border-t border-accent/20"
      >
        <div className="absolute inset-0 -top-[50%] h-[200%] w-full">
            <Image
                ref={ctaImageRef}
                src={PRIVATE_HIRE_CONTENT.cta.image} 
                alt="Join the Guild"
                fill
                className="object-cover contrast-125 brightness-90 transition-[filter] duration-1000"
            />
            <div className="absolute inset-0 bg-black/50" />
        </div>

        <div ref={ctaContentRef} className="relative z-10 text-center px-4">
            <h2 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-white mb-8 drop-shadow-2xl">
                {t("cta.title")}
            </h2>
            <Link 
              href="/book"
              className="group relative mt-4 inline-flex min-h-11 min-w-[11rem] items-center justify-center overflow-hidden px-8 py-4 transition-all duration-300"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80 border border-accent/50" />
                <div className="absolute inset-0 bg-accent transition-opacity duration-500 group-hover:opacity-0" />
                <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-[#F7F0EA]">
                    {t("cta.buttonText")}
                </span>
            </Link>
        </div>
      </section>

    </div>
  );
}