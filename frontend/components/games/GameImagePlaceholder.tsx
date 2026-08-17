"use client";

import { cn } from "@/lib/utils";

interface GameImagePlaceholderProps {
  /** Размер иконки кубика в px. По умолчанию 72. */
  iconSize?: number;
  /** Доп. классы для контейнера (фон, скругление, отступы). */
  className?: string;
}

/**
 * SVG-заглушка для настольных игр без изображения.
 * Рисует силуэт D&D-кубика d20 (икосаэдр) с числом «20» на его грани.
 */
export default function GameImagePlaceholder({
  iconSize = 72,
  className,
}: GameImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-neutral-800",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={iconSize}
        height={iconSize}
        className="text-accent opacity-60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        {/* Икосаэдр d20: внешний шестиугольник (контур кубика) */}
        <polygon points="50,8 84,29 84,71 50,92 16,71 16,29" />
        {/* Ребро, веер граней к верхней вершине (лицо с числом 20) */}
        <path d="M50,8 50,92" />
        <path d="M84,29 16,71" />
        <path d="M16,29 84,71" />
        {/* Центральный треугольник — грань с цифрой */}
        <polygon points="50,34 66,50 50,66 34,50" fill="currentColor" fillOpacity="0.15" />
        {/* Число 20 на грани */}
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="currentColor"
          stroke="none"
          fontFamily="inherit"
        >
          20
        </text>
      </svg>
    </div>
  );
}