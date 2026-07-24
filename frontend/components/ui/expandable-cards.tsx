"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandableCard {
  id: number;
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

  return (
    <div className={cn("flex gap-3 sm:gap-4 w-full h-full", className)}>
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;

        return (
          <div
            key={card.id}
            className="relative h-full overflow-hidden cursor-pointer transition-[flex] duration-500 ease-in-out"
            style={{ flex: isExpanded ? 3 : 1 }}
            onMouseEnter={() => setExpandedId(card.id)}
            onClick={() => setExpandedId(card.id)} 
          >
            <div className="absolute inset-0">
              {typeof card.content === "function" 
                ? card.content(isExpanded) 
                : card.content}
            </div>

            {!isExpanded && (
              <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}
