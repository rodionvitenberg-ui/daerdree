import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./constants"; // <--- Импортируем настройку

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/images/placeholder.jpg"; // Убедитесь, что такой файл есть в папке public/images/
  
  if (path.startsWith("http")) return path;

  // Теперь адрес берется из constants.ts
  return `${API_BASE_URL}${path}`;
};
