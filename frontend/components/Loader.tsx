"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Размер спиннера в px. По умолчанию 28. */
  size?: number;
  /** Доп. классы (цвет, позиционирование и т.п.). */
  className?: string;
  /** Accessible label. */
  label?: string;
}

/**
 * Лёгкий крутящийся кружок акцентного цвета.
 * Используется как лоадер для изображений и загрузки данных.
 */
export default function Loader({ size = 28, className, label = "Loading" }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-block animate-spin text-accent", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}