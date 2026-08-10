"use client";

import { useEffect, useRef } from "react";
import Image from "@/components/AppImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DIVIDER_CONTENT } from "@/content/home";

gsap.registerPlugin(ScrollTrigger);

export default function ParallaxDivider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement & HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const media = mediaRef.current;
    const text = textRef.current;

    if (!container || !media || !text) return;

    const ctx = gsap.context(() => {
      // 1. Параллакс фона (видео/картинка)
      gsap.fromTo(
        media,
        { yPercent: -30 },
        {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      // 2. Анимация текста
      gsap.fromTo(
        text,
        { y: -50, opacity: 0 },
        {
          y: 50,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "center center",
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
      className="relative w-full h-[15dvh] min-h-[300px] overflow-hidden bg-neutral-900 border-y border-secondary z-10 flex items-center justify-center"
    >
      {/* --- ФОН: видео или изображение --- */}
      <div className="absolute inset-0 -top-[75%] h-[250%] w-full">
        {DIVIDER_CONTENT.type === 'video' ? (
          <video
            ref={mediaRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={DIVIDER_CONTENT.src}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <Image
            ref={mediaRef}
            src={DIVIDER_CONTENT.src}
            alt={DIVIDER_CONTENT.alt}
            fill
            className="object-cover contrast-125 brightness-90"
            loading="lazy"
          />
        )}

        {/* Затемнение для читаемости текста */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* --- ТЕКСТ --- */}
      <div
        ref={textRef}
        className="relative z-20 text-center flex flex-col items-center gap-4 px-4"
      >
        <h2 className="font-serif text-5xl md:text-8xl font-black uppercase tracking-widest text-white drop-shadow-2xl select-none">
          Daerdree
        </h2>
        <p className="font-sans text-md lg:text-xl uppercase tracking-[0.5em] text-secondary font-bold select-none">
          Bar & Timeclub
        </p>
      </div>
    </div>
  );
}
