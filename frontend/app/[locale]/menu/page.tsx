"use client";

import Image from "next/image";
import AnimatedContent from "@/components/AnimatedContent";

// === НАСТРОЙКА ===
// Просто перечисли здесь названия своих файлов из папки /public/menu/
const MENU_IMAGES = [
  "/menu/1.jpg",
  "/menu/2.jpg",
  "/menu/3.jpg",
  "/menu/4.jpg",
  "/menu/5.jpg",
  "/menu/6.jpg",
  "/menu/7.jpg",
  "/menu/8.jpg",
  "/menu/9.jpg",
  "/menu/10.jpg",
  "/menu/11.jpg",
  "/menu/12.jpg",
];

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <AnimatedContent distance={20} direction="vertical">
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase tracking-widest text-accent mb-4">
              Drinks & Spirits
            </h1>
            <p className="font-sans text-white/50 text-lg">
              Crafted cocktails and legendary spirits
            </p>
          </AnimatedContent>
        </div>

        {/* СЛИТНОЕ МЕНЮ */}
        <div className="flex justify-center">
          <AnimatedContent 
            distance={40} 
            direction="vertical" 
            className="max-w-lg max-w-xl" // max-w-2xl делает картинку уже, но четче (Retina-эффект)
          >
            {/* Общий контейнер для ВСЕХ картинок.
                Именно у него теперь тень и границы.
            */}
            <div className="flex flex-col w-full bg-neutral-900 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
              
              {MENU_IMAGES.map((src, index) => (
                <div key={index} className="relative w-full">
                  <Image
                    src={src}
                    alt={`Menu page ${index + 1}`}
                    width={1200}
                    height={1600}
                    quality={100}
                    unoptimized={true}
                    // 'block' убирает микро-отступ снизу, который есть у inline-элементов
                    className="w-full h-auto block" 
                    priority={index < 2}
                  />
                  
                  {/* Опционально: Тонкая линия-разделитель между страницами, если нужно знать, где стык */}
                  {/* {index !== MENU_IMAGES.length - 1 && (
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 z-10" />
                  )} */}
                </div>
              ))}

            </div>
          </AnimatedContent>
        </div>
      </div>
    </main>
  );
}