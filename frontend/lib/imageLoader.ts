'use client';

import { ImageLoaderProps } from 'next/image';

export default function myImageLoader({ src, width, quality }: ImageLoaderProps) {
  // 1. Если картинка уже имеет полный URL (например, внешняя ссылка или уже обработанная), возвращаем как есть
  if (src.startsWith('http')) {
    return src;
  }

  // 2. Если путь начинается с "/media/", значит это файл с Django (бэкенд)
  if (src.startsWith('/media/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Убираем слэш в конце API_URL, если он там случайно есть, чтобы избежать "//"
    const cleanApiUrl = apiUrl.replace(/\/$/, ''); 
    return `${cleanApiUrl}${src}`;
  }

  // 3. Во всех остальных случаях (например, "/images/logo.png", "/events/1.webp")
  // считаем, что это локальный файл из папки public фронтенда.
  // Возвращаем src как есть — браузер загрузит его с текущего домена сайта.
  return src;
}