"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DIVIDER_CONTENT } from "@/content/home";

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxDivider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null); // Ref для текста

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    const text = textRef.current;

    if (!container || !image || !text) return;

    const ctx = gsap.context(() => {
      // 1. Анимация ФОНА (Картинка)
      gsap.fromTo(
        image,
        {
          yPercent: -30, // СТАРТ
        },
        {
          yPercent: 30, // ФИНИШ
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // 2. Анимация ТЕКСТА (Parallax эффект глубины)
      // Текст двигается медленнее фона, создавая объем
      gsap.fromTo(
        text,
        {
          y: -50, // Начинает чуть выше
          opacity: 0, 
        },
        {
          y: 50, // Заканчивает чуть ниже
          opacity: 1, // Плавно появляется, когда доскролливаем
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom", // Начинаем чуть раньше появления
            end: "center center", // К центру экрана полностью проявляется
            scrub: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[50vh] min-h-[350px] overflow-hidden bg-neutral-900 border-y border-secondary-1 z-10 flex items-center justify-center"
    >
      {/* --- ФОН --- */}
      <div className="absolute inset-0 -top-[75%] h-[250%] w-full">
        <Image
          ref={imageRef}
          src={DIVIDER_CONTENT.image}
          alt={DIVIDER_CONTENT.alt}
          fill
          className="object-cover contrast-125 brightness-90" // Чуть затемнил и обесцветил для стиля
          priority
        />
        
        {/* Плотное затемнение, чтобы белый текст читался идеально */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* --- ТЕКСТ --- */}
      <div 
        ref={textRef}
        className="relative z-20 text-center flex flex-col items-center gap-4 px-4"
      >
        {/* Заголовок */}
        <h2 className="font-serif text-5xl md:text-8xl font-black uppercase tracking-widest text-white drop-shadow-2xl select-none">
          Daerdree
        </h2>

        {/* Подзаголовок */}
        <p className="font-sans text-md lg:text-xl uppercase tracking-[0.5em] text-secondary font-bold select-none">
          Bar & Timeclub
        </p>
      </div>

    </div>
  );
}