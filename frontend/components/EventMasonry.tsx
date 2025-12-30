"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EVENTS_CONTENT, EVENTS_GALLERY } from "@/content/home";
import AnimatedContent from "./AnimatedContent"; // <--- Импортируем аниматор

gsap.registerPlugin(ScrollTrigger);

export default function EventsMasonry() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".masonry-card");
      
      gsap.fromTo(
        cards,
        { 
          y: 50, 
          opacity: 0,
          scale: 0.9 
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: {
            amount: 1.5,
            grid: "auto",
            from: "random"
          },
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* === ЗАГОЛОВОК С АНИМАЦИЕЙ === */}
        <div className="mb-10 text-center flex flex-col items-center">
          
          {/* Main Title */}
          <AnimatedContent
            distance={100}
            direction="vertical"
            reverse={false}
            duration={1.0}
            ease="ease.out"
            initialOpacity={0}
            animateOpacity
            threshold={0.2}
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold uppercase tracking-widest text-secondary mb-2">
              {EVENTS_CONTENT.title}
            </h2>
          </AnimatedContent>

          {/* Subtitle (с задержкой delay={0.2}) */}
          <AnimatedContent
            distance={100}
            direction="vertical"
            reverse={false}
            duration={1.0}
            delay={0.2} 
            ease="ease.out"
            initialOpacity={0}
            animateOpacity
            threshold={0.2}
          >
            <p className="text-white/50 font-sans text-sm md:text-base">
              {EVENTS_CONTENT.subtitle}
            </p>
          </AnimatedContent>

        </div>

        {/* СЕТКА (ТВОЙ КОД БЕЗ ИЗМЕНЕНИЙ) */}
        <div 
          ref={containerRef}
          className="columns-2 md:columns-4 lg:columns-6 gap-2 space-y-2"
        >
          {EVENTS_GALLERY.map((item, index) => (
            <div 
              key={index} 
              // Оставил твои стили: без rounded, с эффектами
              className="masonry-card break-inside-avoid relative group cursor-pointer overflow-hidden bg-neutral-800"
            >
              <div className={`relative w-full ${item.height === 'tall' ? 'aspect-[3/5]' : 'aspect-square'}`}>
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 16vw"
                />
              </div>
              
              {/* Свечение за карточкой (твое добавление) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600%] h-[20%] bg-accent/10 blur-[80px] rounded-full" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none">
                  <span className="font-serif text-white font-bold text-sm tracking-wider bg-black/50 px-2 py-1">
                    {item.title}
                  </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}