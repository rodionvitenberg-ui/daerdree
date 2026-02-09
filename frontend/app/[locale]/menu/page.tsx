"use client";

import { useState } from "react";
import Image from "next/image";
import AnimatedContent from "@/components/AnimatedContent";
import { X } from "lucide-react"; // Если есть lucide-react. Если нет — замени на <span className="text-white text-4xl">×</span>

// === НАСТРОЙКА ===
const MENU_IMAGES = [
  "/menu/menu-page-1.jpg",
  "/menu/menu-page-2.jpg",
  "/menu/menu-page-3.jpg",
];

// Размеры твоих исходников (для сохранения пропорций при загрузке)
const IMG_WIDTH = 2482;
const IMG_HEIGHT = 3510;

export default function MenuPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background pt-20 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <AnimatedContent distance={20} direction="vertical">
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase tracking-widest text-accent mb-4">
              Drinks & Spirits
            </h1>
            <p className="font-sans text-white/50 text-lg">
              Tap to view full details
            </p>
          </AnimatedContent>
        </div>

        {/* СПИСОК СТРАНИЦ */}
        <div className="flex justify-center">
          <AnimatedContent 
            distance={40} 
            direction="vertical" 
            className="w-full max-w-xl" // Ограничиваем ширину на десктопе, но на мобилке будет почти на весь экран
          >
            <div className="flex flex-col w-full shadow-2xl overflow-hidden rounded-sm">
              
              {MENU_IMAGES.map((src, index) => (
                <div key={src} className="relative w-full group cursor-zoom-in" onClick={() => setSelectedImage(src)}>
                  
                  <Image
                    src={src}
                    alt={`Menu Page ${index + 1}`}
                    width={IMG_WIDTH}
                    height={IMG_HEIGHT}
                    quality={100} // Максимальное качество JPEG
                    priority={index === 0} // Первая страница грузится мгновенно
                    // sizes говорит браузеру: "На мобилке бери картинку на 100% ширины экрана, на десктопе — 600px"
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.01]"
                  />

                  {/* Разделитель (Border Accent 5px) */}
                  {/* Рендерим его только ЕСЛИ это не последняя картинка */}
                  {index !== MENU_IMAGES.length - 1 && (
                    <div className="w-full h-[5px] bg-background relative z-10" />
                  )}
                  
                </div>
              ))}

            </div>
          </AnimatedContent>
        </div>
      </div>

      {/* === LIGHTBOX (МОДАЛКА) === */}
      {/* Появляется только если выбрана картинка */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // Закрыть при клике на фон
        >
          {/* Кнопка закрытия */}
          <button className="absolute top-6 right-6 text-white/70 hover:text-accent transition-colors p-2 z-50">
            {/* Если нет lucide-react, просто напиши "CLOSE" или "X" */}
             <X size={40} /> 
          </button>

          {/* Контейнер картинки в модалке */}
          <div 
            className="relative w-full h-full flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()} // Чтобы клик по картинке не закрывал модалку (опционально)
          >
            {/* Здесь используем обычный img для нативной поддержки зума браузером или Next/Image без ограничений */}
            <div className="relative w-full max-w-4xl max-h-full overflow-y-auto rounded-md custom-scrollbar">
               <Image
                src={selectedImage}
                alt="Full screen menu"
                width={IMG_WIDTH}
                height={IMG_HEIGHT}
                quality={100}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}