"use client";
import Link from "next/link";
import { useState, useEffect } from 'react';
import Image from '@/components/AppImage';
import { HERO_CONTENT } from '@/content/home';
import AnimatedContent from './AnimatedContent';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('Hero');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_CONTENT.slides.length);
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[80dvh] min-h-[80dvh] w-full overflow-hidden">
      
      {HERO_CONTENT.slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out
            ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'}
          `}
        >
          
          {/* --- DESKTOP (TRIPTYCH) --- */}
          <div className="hidden md:grid h-full w-full grid-cols-3 gap-0"> 
             {slide.desktop.map((item, colIndex) => (
               <div key={colIndex} className="relative h-full w-full overflow-hidden">
                 {item.type === 'video' ? (
                   <video
                     className={`h-full w-full object-cover ${index === currentSlide ? 'ken-burns' : ''}`}
                     src={item.src}
                     autoPlay loop muted playsInline
                   />
                  ) : (
                    <Image
                       src={item.src}
                       alt={`Desktop slide ${index} part ${colIndex}`}
                       fill
                       className={`object-cover ${index === currentSlide ? 'ken-burns' : ''}`}
                       priority={index === currentSlide && index === 0}
                       loading={index === currentSlide ? undefined : "lazy"}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50" />
                </div>
              ))}
           </div>

           {/* --- MOBILE (FULLSCREEN SOLO) --- */}
           <div className="block md:hidden h-full w-full relative">
              
               {slide.mobile.type === 'video' ? (
                  <video
                    className={`h-full w-full object-cover ${index === currentSlide ? 'ken-burns' : ''}`}
                    src={slide.mobile.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
               ) : (
                  <Image
                    src={slide.mobile.src}
                    alt={`Mobile slide ${index}`}
                    fill
                    className={`object-cover ${index === currentSlide ? 'ken-burns' : ''}`}
                    priority={index === currentSlide}
                    loading={index === currentSlide ? undefined : "lazy"}
                  />
               )}

             <div className="absolute inset-0 bg-black/50" />
          </div>

        </div>
      ))}

{/* --- КОНТЕНТ (ТЕКСТ + КНОПКА) --- */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
        
        <div className="flex flex-col items-center gap-6">
            
            <AnimatedContent
              distance={150}
              direction="vertical"
              reverse={false}
              duration={0.8}
              ease="ease.out"
              initialOpacity={0.2}
              animateOpacity
              scale={1.1}
              threshold={0.2}
              delay={0.1}
            >
              <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-white md:text-5xl lg:text-6xl drop-shadow-[0_1px_30px_rgba(0,0,0,0.5)] text-balance">
                  {t('title')}
              </h1>
            </AnimatedContent>
            
            <AnimatedContent
              distance={200}
              direction="vertical"
              reverse={false}
              duration={0.8}
              ease="ease.out"
              initialOpacity={0.0}
              animateOpacity
              scale={1.1}
              threshold={0.2}
              delay={0.3}
            >
              <p className="font-serif text-lg font-medium tracking-wide text-gray-200 md:text-2xl drop-shadow-lg max-w-2xl text-pretty">
                  {t('subtitle')}
              </p>
            </AnimatedContent>

            <Link 
              href="/book"
              className="btn btn-primary mt-4"
            >
                {t('buttonText')}
            </Link>

        </div>
      </div>

    </section>
  );
}
