"use client";

import Image from "next/image";
import { useRef } from "react";

interface CarouselCard {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface SimpleCarouselProps {
  cards: CarouselCard[];
}

export default function SimpleCarousel({ cards }: SimpleCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Функция для скролла по кнопкам (если захочешь добавить стрелки)
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full group">
      
      {/* КОНТЕЙНЕР СКРОЛЛА
          snap-x snap-mandatory: заставляет скролл "прилипать" к элементам
          overflow-x-auto: разрешает горизонтальную прокрутку
          scrollbar-hide: прячет полосу прокрутки (нужен плагин или кастомный CSS, 
          если нет - добавь в globals.css: .scrollbar-hide::-webkit-scrollbar { display: none; } )
      */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full pb-8 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Хаки для скрытия скроллбара
      >
        {cards.map((card, index) => (
          <div 
            key={card.id || index}
            // min-w-[85vw]: На мобилке карточка занимает 85% экрана (виден край следующей)
            // md:min-w-[600px]: На десктопе фиксированная ширина
            className="relative shrink-0 w-[85vw] md:w-[600px] h-[500px] snap-center bg-neutral-900 border border-white/10 select-none"
          >
            
            {/* КАРТИНКА */}
            <div className="relative w-full h-full">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover opacity-80"
                draggable={false} // Чтобы не мешало свайпу мышкой
              />
              {/* Градиент снизу вверх */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* ТЕКСТ (Поверх картинки) */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col justify-end">
              <h3 className="font-serif text-2xl md:text-3xl font-bold uppercase tracking-widest text-white mb-3">
                {card.title}
              </h3>
              <p className="font-sans text-gray-300 text-sm md:text-base leading-relaxed max-w-sm">
                {card.description}
              </p>
            </div>

          </div>
        ))}
      </div>

      {/* Опционально: Индикатор скролла ("Точки" или прогрессбар можно добавить здесь) */}
      <div className="flex justify-center gap-2 mt-4 md:hidden">
         <span className="text-xs text-white/30 uppercase tracking-widest">Swipe to explore &rarr;</span>
      </div>

    </div>
  );
}