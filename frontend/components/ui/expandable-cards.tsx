"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Изменили тип content: теперь это функция, которая получает isExpanded
interface ExpandableCard {
  id: number;
  // content может быть просто узлом ИЛИ функцией
  content: React.ReactNode | ((isExpanded: boolean) => React.ReactNode);
}

interface ExpandableCardsProps {
  cards: ExpandableCard[];
  defaultExpanded?: number;
  className?: string;
}

export default function ExpandableCards({
  cards,
  defaultExpanded = 0,
  className,
}: ExpandableCardsProps) {
  const [expandedId, setExpandedId] = useState<number>(defaultExpanded);

  const getCardVariants = () => ({
    expanded: { flex: 3, transition: { duration: 0.5, ease: "easeInOut" } },
    collapsed: { flex: 1, transition: { duration: 0.5, ease: "easeInOut" } },
  });

  return (
    <div className={cn("flex gap-3 sm:gap-4 w-full h-full", className)}>
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;

        return (
          <motion.div
            key={card.id}
            className="relative h-full overflow-hidden cursor-pointer"
            variants={getCardVariants()}
            initial={isExpanded ? "expanded" : "collapsed"}
            animate={isExpanded ? "expanded" : "collapsed"}
            onMouseEnter={() => setExpandedId(card.id)}
            // Добавляем onClick для мобилок, где нет hover
            onClick={() => setExpandedId(card.id)} 
          >
            <div className="absolute inset-0">
              {/* Проверяем: если content - это функция, вызываем её с флагом isExpanded */}
              {typeof card.content === "function" 
                ? card.content(isExpanded) 
                : card.content}
            </div>

            {/* Затемнение для неактивных карточек (опционально, если не нужно - убери) */}
            {!isExpanded && (
              <motion.div
                className="absolute inset-0 bg-black/40 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}