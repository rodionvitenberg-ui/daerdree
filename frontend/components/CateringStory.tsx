"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedContent from "./AnimatedContent";
import ExpandableCards from "./ui/expandable-cards"; 
import SimpleCarousel from "./SimpleCarousel";   
import BlurText from "./BlurText";               
import { CATERING_STACK_CONTENT } from "@/content/home";
import { useTranslations } from "next-intl";

// Тип для текстов, которые придут из JSON
interface TranslatedCard {
  title: string;
  description: string;
}

export default function CateringStory() {
  const t = useTranslations("CateringStory"); // Инициализировали переводы
  
  // Получаем массив текстов для карточек из JSON
  const translatedCards = t.raw("cards") as TranslatedCard[];

  // Сшиваем картинки из конфига с текстами из JSON
  const localizedCards = CATERING_STACK_CONTENT.cards.map((card, index) => ({
    ...card,
    title: translatedCards[index]?.title || "",
    description: translatedCards[index]?.description || "",
  }));
  
  // === 1. ДАННЫЕ ДЛЯ DESKTOP (ExpandableCards) ===
  const desktopCardsData = localizedCards.map((card, index) => ({
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
            <div
              className={`flex flex-col gap-2 transition-opacity duration-300 ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
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
            </div>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <section className="relative w-full bg-background py-20 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* ЗАГОЛОВОК */}
        <div className="text-center mb-10 md:mb-16 max-w-4xl mx-auto">
          <AnimatedContent distance={30} direction="vertical">
            <h2 className="font-serif text-3xl md:text-6xl font-bold uppercase tracking-widest text-secondary mb-4">
              {t("title")}
            </h2>
          </AnimatedContent>
          <AnimatedContent distance={30} direction="vertical" delay={0.1}>
            <p className="font-sans text-secondary/80 text-base md:text-xl">
              {t("subtitle")}
            </p>
          </AnimatedContent>
        </div>

        {/* === ПЕРЕКЛЮЧАТЕЛЬ VIEW === */}
        <div className="w-full mb-12 md:mb-16">
          <AnimatedContent distance={50} direction="vertical" delay={0.2} duration={1}>
            
            {/* ВАРИАНТ 1: МОБИЛЬНЫЙ (Carousel) */}
            <div className="block md:hidden -mx-4 w-[calc(100%+2rem)] overflow-hidden">
               {/* Передаем сшитые локализованные данные */}
               <SimpleCarousel cards={localizedCards} />
            </div>

            {/* ВАРИАНТ 2: ДЕСКТОП (ExpandableCards) */}
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
            <Link href="/events" className="btn btn-outline btn-sm">
                {t("buttonText")}
            </Link>
        </div>

      </div>
    </section>
  );
}