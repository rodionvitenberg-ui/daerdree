"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Регистрируем плагин
gsap.registerPlugin(ScrollTrigger);

export default function PrivateHirePage() {
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaImageRef = useRef<HTMLImageElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ctaContainerRef.current;
    const image = ctaImageRef.current;
    const content = ctaContentRef.current;

    if (!container || !image || !content) return;

    const ctx = gsap.context(() => {
      // 1. Анимация ФОНА (Точь-в-точь как в ParallaxDivider)
      gsap.fromTo(
        image,
        {
          yPercent: -30, // СТАРТ: Смещен вверх
        },
        {
          yPercent: 30, // ФИНИШ: Смещен вниз
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true, // Плавная привязка к скроллу
          },
        }
      );

      // 2. Анимация ТЕКСТА (Эффект глубины)
      gsap.fromTo(
        content,
        {
          y: -50, // Начинает чуть выше
          opacity: 0, 
        },
        {
          y: 50, // Заканчивает чуть ниже (двигается медленнее фона)
          opacity: 1, // Полностью проявляется к центру
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

  return (
    <main className="bg-neutral-950 min-h-screen text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero/4.webp"
          alt="Private Event Atmosphere"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-neutral-950" />
        
        <div className="relative z-10 text-center px-4">
          <Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold uppercase text-white/30 hover:text-accent transition-colors mb-6">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            <span>Back to Hub</span>
          </Link>
          <AnimatedContent direction="vertical">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-widest text-accent mb-4">
              Private Saga
            </h1>
            <p className="font-sans text-lg md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Your party. Your rules. Our dungeon.<br/>
              We handle the food, the games, and the chaos.
            </p>
          </AnimatedContent>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Link href="/book">
               <button className="px-10 py-4 bg-accent text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-colors">
                 Book Your Event
               </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. THE GAME MASTER */}
      <section className="py-24 px-4 border-b border-white/5">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="md:w-1/2 relative h-[500px] w-full group">
                <div className="absolute top-0 left-0 w-4/5 h-4/5 z-10">
                    <Image src="/images/hero/2.webp" alt="People playing" fill className="object-cover border border-white/10 shadow-2xl" />
                </div>
                <div className="absolute bottom-0 right-0 w-3/5 h-3/5 z-20 transform translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                     <Image src="/images/hero/5.webp" alt="Game Master" fill className="object-cover border border-accent/30 shadow-2xl transition-all" />
                </div>
            </div>
            
            <div className="md:w-1/2">
                <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">All Inclusive</span>
                <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
                    The Game Master Included
                </h2>
                <p className="text-white/60 text-lg mb-6 leading-relaxed">
                    Don't know the rules? Don't worry. Our Game Masters are part of the package. 
                    They will explain the rules, moderate the disputes, and ensure the laughter never stops.
                </p>
                <p className="text-white/60 text-lg leading-relaxed">
                    Perfect for birthdays, corporate team buildings, or just a massive guild gathering.
                </p>
            </div>
        </div>
      </section>

      {/* 3. THE FEAST */}
      <section className="py-24 px-4">
        <div className="container mx-auto flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
             <div className="md:w-1/2 relative h-[400px] w-full">
                 <Image src="/images/hero/3.webp" alt="Food Catering" fill className="object-cover duration-700" />
                 <div className="absolute inset-0 border border-white/10 pointer-events-none" />
            </div>

            <div className="md:w-1/2">
                <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">Supply Drop</span>
                <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
                    The Feast
                </h2>
                <p className="text-white/60 text-lg mb-6 leading-relaxed">
                    No menus, no complications. We cover the table with a curated selection of snacks, drinks, and hearty food designed to be eaten while gaming.
                </p>
                <ul className="space-y-2 text-white/50 font-serif uppercase text-sm tracking-widest">
                    <li className="flex items-center gap-2"><span className="text-accent">•</span> Craft Snacks</li>
                    <li className="flex items-center gap-2"><span className="text-accent">•</span> Hot Platters</li>
                    <li className="flex items-center gap-2"><span className="text-accent">•</span> Themed Drinks</li>
                </ul>
            </div>
        </div>
      </section>

      {/* 4. READY TO START? (PARALLAX CTA) */}
      <section 
        ref={ctaContainerRef}
        className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden border-t border-accent/20"
      >
        {/* ФОН (Большой запас высоты для параллакса) */}
        <div className="absolute inset-0 -top-[50%] h-[200%] w-full">
            <Image
                ref={ctaImageRef}
                src="/events/11.png" 
                alt="Join the Guild"
                fill
                className="object-cover contrast-125 brightness-90"
            />
            {/* Плотное затемнение */}
            <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* КОНТЕНТ ПО ЦЕНТРУ */}
        <div ref={ctaContentRef} className="relative z-10 text-center px-2">
            <h2 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-white mb-8 drop-shadow-2xl">
                Ready to Start?
            </h2>
            <Link href="/book">
                <button className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.25em] hover:bg-accent hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    Contact the Guild
                </button>
            </Link>
        </div>
      </section>

    </main>
  );
}