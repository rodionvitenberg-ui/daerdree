"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/card";
import { cn } from "@/lib/utils";

type FlipStackCard = {
  id: number;
  content?: React.ReactNode;
};

type FlipStackProps = {
  cards: FlipStackCard[];
  mobileDirection?: "top" | "bottom";
  className?: string;
};

export default function FlipStack({
  cards,
  mobileDirection = "top",
  className,
}: FlipStackProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // Для мобилок
  const [isHovered, setIsHovered] = useState(false); // Для десктопа
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // АВТО-ПЕРЕКЛЮЧЕНИЕ ТОЛЬКО ДЛЯ МОБИЛОК
  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isMobile, cards.length]);

  const getRotation = (index: number) => {
    // Небольшой рандомный поворот для эффекта стопки
    const rotations = [-4, 3, -2, 5, -3];
    return rotations[index % rotations.length];
  };

  const getCardVariants = (index: number) => {
    const totalCards = cards.length;
    const centerIndex = Math.floor(totalCards / 2);
    // Сдвигаем индексы так, чтобы центр был 0
    const positionFromCenter = index - centerIndex;

    // --- МОБИЛЬНАЯ ВЕРСИЯ (Слайдер) ---
    if (isMobile) {
      const isActive = index === activeIndex;
      const yInitial = mobileDirection === "bottom" ? -50 : 50;
      
      return {
        initial: { opacity: 0, scale: 0.9, y: yInitial, zIndex: 0 },
        animate: { 
          opacity: isActive ? 1 : 0, 
          scale: isActive ? 1 : 0.9, 
          y: isActive ? 0 : yInitial,
          zIndex: isActive ? 10 : 0
        },
      };
    }

    // --- ДЕСКТОП ВЕРСИЯ (Hover Effect) ---
    
    // Состояние 1: СЛОЖЕНО (Stacked)
    // Карты лежат друг на друге с небольшим поворотом
    const stackedState = {
      x: index * 2, // Чуть-чуть сдвигаем, чтобы было видно стопку
      y: index * 2,
      rotate: getRotation(index), 
      scale: 1,
      zIndex: totalCards - index, // Верхняя карта первая
    };

    // Состояние 2: РАСКРЫТО (Spread)
    // Карты веером
    const spreadState = {
      x: positionFromCenter * 130, // Разлет по горизонтали
      y: Math.abs(positionFromCenter) * 15, // Арка (центр выше краев)
      rotate: positionFromCenter * 8, // Поворот веером
      scale: 1.1, // Чуть увеличиваем
      zIndex: totalCards + index, // Чтобы при наложении порядок был красивым
    };

    return {
      initial: stackedState,
      animate: isHovered ? spreadState : stackedState,
    };
  };

  return (
    <div 
      className={cn("h-full w-full flex items-center justify-center py-10", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={containerRef} className="relative h-80 w-full max-w-2xl mx-auto flex items-center justify-center">
        
        {/* Контейнер карт */}
        <div className="relative w-full h-full flex items-center justify-center perspective-1000">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => {
              return (
                <motion.div
                  key={card.id}
                  className="absolute origin-bottom cursor-pointer"
                  variants={getCardVariants(index)}
                  initial="initial"
                  animate="animate"
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Сама карта */}
                  <Card className="w-90 h-120 shadow-2xl border border-white/10 bg-neutral-900 overflow-hidden relative group">
                    <CardContent className="p-0 h-full w-full">
                      {card.content}
                      {/* Оверлей блеска */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}