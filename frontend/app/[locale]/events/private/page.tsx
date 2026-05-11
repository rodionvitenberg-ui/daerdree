"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";
import BounceCards from "@/components/BounceCards";
import SimpleCarousel from "@/components/SimpleCarousel"; 
import { PRIVATE_HIRE_CONTENT } from "@/content/privateevents";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl"; // <-- Импорт локализации

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

  const threeCardsTransform = [
    "rotate(5deg) translate(-250px)",
    "rotate(0deg) translate(-140px)",
    "rotate(-5deg)",
    "rotate(5deg) translate(140px)",
    "rotate(-5deg) translate(250px)"
  ];

  const fourCardsTransform = [
    "rotate(5deg) translate(-250px)",
    "rotate(0deg) translate(-140px)",
    "rotate(-5deg)",
    "rotate(5deg) translate(140px)",
    "rotate(-5deg) translate(250px)"
  ];

  const gmCarouselData = PRIVATE_HIRE_CONTENT.gameMaster.images.map((src, i) => ({
    id: i,
    image: src,
    title: "", 
    description: ""
  }));

  const feastCarouselData = PRIVATE_HIRE_CONTENT.feast.images.map((src, i) => ({
    id: i,
    image: src,
    title: "",
    description: ""
  }));

  // Получаем массив особенностей из JSON для рендеринга
  const gameMasterFeatures = t.raw("gameMaster.features") as string[];

  return (
    <main className="bg-neutral-950 min-h-screen text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src={PRIVATE_HIRE_CONTENT.hero.image}
          alt="Private Event Atmosphere"
          fill
          className="object-cover opacity-40"
          priority
        />
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
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Link 
              href="/book" 
              className="group relative mt-4 inline-block overflow-hidden px-3 py-4 transition-all duration-300" 
            >
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80 border border-accent/50 " />
                <div className="absolute inset-0 bg-accent transition-opacity duration-500 group-hover:opacity-0" />
                <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-secondary">
                    {t("hero.buttonText")}
                </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. THE GAME MASTER */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            
            <div className="w-full md:w-1/2 relative z-10">
                <div className="block md:hidden w-full pb-8">
                   <div className="-mx-4 w-[calc(100%+2rem)]"> 
                      <SimpleCarousel cards={gmCarouselData as any} />
                   </div>
                </div>

                <div className="hidden md:flex h-[400px] items-center justify-center">
                    <BounceCards 
                      images={PRIVATE_HIRE_CONTENT.gameMaster.images}
                      containerWidth={600}
                      containerHeight={600}
                      transformStyles={threeCardsTransform}
                      enableHover={true}
                    />
                    <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full -z-10 transform scale-75" />
                </div>
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
                 <div className="block md:hidden w-full pb-8">
                    <div className="-mx-4 w-[calc(100%+2rem)]">
                       {/* ИСПРАВЛЕНО: Теперь здесь feastCarouselData */}
                       <SimpleCarousel cards={feastCarouselData as any} />
                    </div>
                 </div>

                 <div className="hidden md:flex h-[500px] items-center justify-center">
                     <BounceCards 
                       images={PRIVATE_HIRE_CONTENT.feast.images}
                       containerWidth={400}
                       containerHeight={400}
                       transformStyles={fourCardsTransform}
                       enableHover={true}
                     />
                     <div className="absolute inset-0 bg-secondary/5 blur-3xl rounded-full -z-10 transform scale-75" />
                 </div>
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
        className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden border-t border-accent/20"
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
            <Link href="/book">
                <button className="px-12 py-5 bg-secondary text-black font-black uppercase tracking-[0.25em] hover:bg-accent hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    {t("cta.buttonText")}
                </button>
            </Link>
        </div>
      </section>

    </main>
  );
}