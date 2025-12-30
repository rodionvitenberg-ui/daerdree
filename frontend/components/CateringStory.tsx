"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedContent from "./AnimatedContent";
import ExpandableCards from "./ui/expandable-cards"; // Твой аккордеон
import SimpleCarousel from "./SimpleCarousel";   // Твоя карусель
import BlurText from "./BlurText";               // Твой текст
import { CATERING_STACK_CONTENT } from "@/content/home";
import { AnimatePresence, motion } from "framer-motion";

export default function CateringStory() {
  
  // === 1. ДАННЫЕ ДЛЯ DESKTOP (ExpandableCards) ===
  // Здесь мы используем сложную верстку с BlurText и эффектами
  const desktopCardsData = CATERING_STACK_CONTENT.cards.map((card, index) => ({
    id: index,
    content: (isExpanded: boolean) => (
      <div className="relative w-full h-full group">
        
        {/* Картинка */}
        <Image
          src={card.image}
          alt={card.title}
          fill
          className={`object-cover transition-transform duration-700 ${isExpanded ? 'scale-100' : 'scale-110'}`}
        />
        
        {/* Градиент */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

        {/* Контент */}
        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  key="content-active"
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <div className="font-serif font-bold uppercase tracking-widest text-white text-3xl">
                     <BlurText
                        text={card.title}
                        delay={10}
                        className="text-white"
                        animateBy="words"
                     />
                  </div>
                  
                  <div className="font-sans text-gray-300 text-base leading-relaxed max-w-md min-w-[250px]">
                    <BlurText
                        text={card.description}
                        delay={20}
                        className="text-gray-300"
                     />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    ),
  }));

  // === 2. ДАННЫЕ ДЛЯ MOBILE (SimpleCarousel) ===
  // Здесь просто берем "сырые" данные из конфига, карусель сама разберется

  return (
    <section className="relative w-full bg-background py-20 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* ЗАГОЛОВОК */}
        <div className="text-center mb-10 md:mb-16 max-w-4xl mx-auto">
          <AnimatedContent distance={30} direction="vertical">
            <h2 className="font-serif text-3xl md:text-6xl font-bold uppercase tracking-widest text-secondary mb-4">
              {CATERING_STACK_CONTENT.title}
            </h2>
          </AnimatedContent>
          <AnimatedContent distance={30} direction="vertical" delay={0.1}>
            <p className="font-sans text-secondary/80 text-base md:text-xl">
              {CATERING_STACK_CONTENT.subtitle}
            </p>
          </AnimatedContent>
        </div>

        {/* === ПЕРЕКЛЮЧАТЕЛЬ VIEW === */}
        <div className="w-full mb-12 md:mb-16">
          <AnimatedContent distance={50} direction="vertical" delay={0.2} duration={1}>
            
            {/* ВАРИАНТ 1: МОБИЛЬНЫЙ (Carousel) 
                block = показываем
                md:hidden = прячем начиная с планшета
            */}
            <div className="block md:hidden">
               <SimpleCarousel cards={CATERING_STACK_CONTENT.cards} />
            </div>

            {/* ВАРИАНТ 2: ДЕСКТОП (ExpandableCards) 
                hidden = прячем
                md:block = показываем начиная с планшета
                h-[600px] = фиксированная высота для десктопа
            */}
            <div className="hidden md:block h-[600px] w-full select-none">
              <ExpandableCards
                cards={desktopCardsData}
                defaultExpanded={0}
              />
            </div>

          </AnimatedContent>
        </div>

        {/* КНОПКА */}
        <div className="flex justify-center">
            <Link href="/events">
         <button className="group relative overflow-hidden px-10 py-4 md:px-8 md:py-3 border border-accent transition-all duration-300">
         <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
          <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-secondary text-sm md:text-base">
          {CATERING_STACK_CONTENT.buttonText}
          </span>
        </button>
            </Link>
        </div>

      </div>
    </section>
  );
}