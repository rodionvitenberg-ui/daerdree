"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { HERO_CONTENT } from '@/content/home';
import AnimatedContent from './AnimatedContent';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_CONTENT.slides.length);
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[80vh] w-full overflow-hidden">
      
      {HERO_CONTENT.slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 h-[80vh] w-full transition-opacity duration-1000 ease-in-out
            ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'}
          `}
        >
          
          {/* --- DESKTOP (TRIPTYCH) --- */}
          <div className="hidden md:grid h-[80vh] w-full grid-cols-3 gap-0"> 
             {slide.desktop.map((item, colIndex) => (
               <div key={colIndex} className="relative h-[80vh] w-full overflow-hidden">
                 {item.type === 'video' ? (
                   <video
                     className="h-[80vh] w-full object-cover"
                     src={item.src}
                     autoPlay loop muted playsInline
                   />
                 ) : (
                   <Image
                      src={item.src}
                      alt={`Desktop slide ${index} part ${colIndex}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                   />
                 )}
                 <div className="absolute inset-0 bg-black/50" />
               </div>
             ))}
          </div>

          {/* --- MOBILE (FULLSCREEN SOLO) --- */}
          <div className="block md:hidden h-[80vh] w-full relative">
             
             {/* Проверяем тип контента для мобилки */}
             {slide.mobile.type === 'video' ? (
                <video
                  className="h-[80vh] w-full object-cover"
                  src={slide.mobile.src}
                  autoPlay
                  loop
                  muted
                  playsInline // КРИТИЧНО ВАЖНО для iOS, иначе видео не запустится
                />
             ) : (
                <Image
                  src={slide.mobile.src}
                  alt={`Mobile slide ${index}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
             )}

             {/* Затемнение */}
             <div className="absolute inset-0 bg-black/50" />
          </div>

        </div>
      ))}

{/* --- КОНТЕНТ (ТЕКСТ + КНОПКА) --- */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
        
        {/* key={currentSlide} заставляет анимацию перезапускаться при смене слайда.
            Если хочешь, чтобы текст появился один раз и стоял — убери key={currentSlide} отсюда. 
        */}
        <div className="flex flex-col items-center gap-6">
            
            {/* АНИМАЦИЯ ЗАГОЛОВКА */}
            <AnimatedContent
              distance={150}
              direction="vertical"
              reverse={false}
              duration={1.2}
              ease="ease.out"
              initialOpacity={0.2}
              animateOpacity
              scale={1.1}
              threshold={0.2}
              delay={0.1} // Стартует почти сразу
            >
              <h1 className="font-serif text-5xl font-black uppercase tracking-widest text-white md:text-5xl lg:text-4xl drop-shadow-2xl">
                  {HERO_CONTENT.title}
              </h1>
            </AnimatedContent>
            
            {/* АНИМАЦИЯ ПОДЗАГОЛОВКА */}
            <AnimatedContent
              distance={200}
              direction="vertical"
              reverse={false} // Пусть вылетает с другой стороны для красоты? Или false, как хочешь.
              duration={1.2}
              ease="ease.out"
              initialOpacity={0.0}
              animateOpacity
              scale={1.1}
              threshold={0.2}
              delay={0.3} // Чуть позже заголовка
            >
              <p className="font-serif text-lg font-medium tracking-wide text-gray-200 md:text-2xl drop-shadow-lg max-w-2xl">
                  {HERO_CONTENT.subtitle}
              </p>
            </AnimatedContent>

            {/* АНИМАЦИЯ КНОПКИ */}
              <button className="group relative mt-4 overflow-hidden px-3 py-4 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent-600 to-accent-600 opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
                  <div className="absolute inset-0 bg-accent transition-opacity duration-500 group-hover:opacity-0" />
                  <span className="relative z-10 font-serif font-bold uppercase tracking-[0.2em] text-[#F7F0EA]">
                      {HERO_CONTENT.buttonText}
                  </span>
              </button>

        </div>
      </div>

    </section>
  );
}