import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Замени на адрес своего бэкенда, если он поменяется
const API_BASE_URL = "http://127.0.0.1:8000";

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/images/placeholder.jpg"; // Заглушка, если картинки нет
  
  // Если путь уже полный (начинается с http), возвращаем как есть
  if (path.startsWith("http")) return path;

  // Иначе приклеиваем домен бэкенда
  return `${API_BASE_URL}${path}`;
};
