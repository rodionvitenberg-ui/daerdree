"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "@/components/AppImage";
import AnimatedContent from "@/components/AnimatedContent";
import { PRIVATE_HIRE_CONTENT } from "@/content/privateevents";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

const ROTATION_INTERVAL = 5000; // 5 seconds

/** Returns `count` images from `arr` starting at `startIdx`, wrapping around. */
function getSlidingImages<T>(arr: T[], startIdx: number, count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(arr[(startIdx + i) % arr.length]);
  }
  return result;
}

export default function PrivateHirePage() {
  const t = useTranslations("PrivateEvents");

  const heroSectionRef = useRef<HTMLElement>(null);
  const ctaContainerRef = useRef<HTMLElement>(null);
  const ctaImageRef = useRef<HTMLImageElement>(null);
  const ctaContentRef = useRef<HTMLDivElement>(null);
  const cardContainerRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  const gameMasterFeatures = t.raw("gameMaster.features") as string[];

  // --- Image rotation state ---
  const allGameImages = PRIVATE_HIRE_CONTENT.gameMaster.images;
  const allFeastImages = PRIVATE_HIRE_CONTENT.feast.images;

  const [gameStartIdx, setGameStartIdx] = useState(0);
  const [feastStartIdx, setFeastStartIdx] = useState(0);
  // Пропускаем fade-in при первом рендере — карточки анимирует scroll-entrance
  const firstRenderRef = useRef(true);

  // Мягкое появление новых карточек после смены слайда
  useEffect(() => {
    const gameContainer = cardContainerRefs[0].current;
    const feastContainer = cardContainerRefs[1].current;
    const gameCards = gameContainer?.querySelectorAll(".variant-card-a");
    const feastCards = feastContainer?.querySelectorAll(".variant-card-a");

    if (firstRenderRef.current) {
      // Первый рендер: карточки покажет staggered 3D entrance ниже
      firstRenderRef.current = false;
      return;
    }

    if (gameCards?.length) {
      gsap.fromTo(
        gameCards,
        { opacity: 0, scale: 0.96, y: 10, filter: "blur(4px)" },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "filter",
        }
      );
    }
    if (feastCards?.length) {
      gsap.fromTo(
        feastCards,
        { opacity: 0, scale: 0.96, y: 10, filter: "blur(4px)" },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "filter",
        }
      );
    }
  }, [gameStartIdx, feastStartIdx]);

  // Ротация: сначала мягко гасим текущие карточки, затем меняем слайд,
  // чтобы появление новых шло поверх плавного перехода
  useEffect(() => {
    const interval = setInterval(() => {
      const gameContainer = cardContainerRefs[0].current;
      const feastContainer = cardContainerRefs[1].current;
      const gameCards = gameContainer?.querySelectorAll(".variant-card-a");
      const feastCards = feastContainer?.querySelectorAll(".variant-card-a");

      const cardsToHide: Element[] = [];
      if (gameCards?.length) cardsToHide.push(...Array.from(gameCards));
      if (feastCards?.length) cardsToHide.push(...Array.from(feastCards));

      if (cardsToHide.length === 0) {
        setGameStartIdx((prev) => (prev + 1) % allGameImages.length);
        setFeastStartIdx((prev) => (prev + 1) % allFeastImages.length);
        return;
      }

      gsap.to(cardsToHide, {
        opacity: 0,
        scale: 0.96,
        y: 8,
        duration: 0.45,
        ease: "power2.inOut",
        stagger: 0.04,
        onComplete: () => {
          setGameStartIdx((prev) => (prev + 1) % allGameImages.length);
          setFeastStartIdx((prev) => (prev + 1) % allFeastImages.length);
        },
      });
    }, ROTATION_INTERVAL);

    return () => {
      clearInterval(interval);
      gsap.killTweensOf(".variant-card-a");
    };
  }, [allGameImages.length, allFeastImages.length]);

  const visibleGameImages = getSlidingImages(allGameImages, gameStartIdx, 3);
  const visibleFeastImages = getSlidingImages(allFeastImages, feastStartIdx, 3);

  // --- GSAP animations ---
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax
      const hero = heroSectionRef.current;
      if (hero) {
        const heroImg = hero.querySelector("img");
        if (heroImg) {
          gsap.fromTo(
            heroImg,
            { scale: 1.1 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 1.5,
              },
            }
          );
        }
      }

      // Card sections — staggered 3D tilt entrance
      cardContainerRefs.forEach((ref) => {
        const container = ref.current;
        if (!container) return;
        const cards = container.querySelectorAll(".variant-card-a");
        gsap.fromTo(
          cards,
          { opacity: 0, y: 120, rotateX: 15, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1,
            ease: "power4.out",
            stagger: 0.25,
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              once: true,
            },
          }
        );
      });

      // CTA parallax
      const container = ctaContainerRef.current;
      const image = ctaImageRef.current;
      const content = ctaContentRef.current;
      if (container && image && content) {
        gsap.fromTo(
          image,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
        gsap.fromTo(
          content,
          { y: -30, opacity: 0 },
          {
            y: 30,
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
      }
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-neutral-950 min-h-dvh text-white">
      {/* 1. HERO */}
      <section
        ref={heroSectionRef}
        className="relative min-h-dvh flex items-center justify-center pb-16 md:pb-0 overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src={PRIVATE_HIRE_CONTENT.hero.image}
            alt=""
            fill
            className="object-cover opacity-40 scale-110"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-neutral-950" />

        <div className="relative z-10 text-center px-4">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase text-secondary/30 hover:text-secondary transition-colors mb-6"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <span>{t("back")}</span>
          </Link>
          <AnimatedContent direction="vertical">
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-widest text-secondary mb-4">
              {t("hero.title")}
            </h1>
            <p className="font-sans text-lg md:text-2xl text-secondary/80 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
              {t("hero.description")}
            </p>
          </AnimatedContent>

          <div className="mt-12">
            <Link href="/book" className="btn btn-primary">
              {t("hero.buttonText")}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. GAME MASTER */}
      <section className="py-24 px-4 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2 relative z-10">
            <div
              ref={cardContainerRefs[0]}
              className="grid grid-cols-2 gap-3 perspective-[1200px]"
            >
              {visibleGameImages.map((src, i) => (
                <div
                  key={`${gameStartIdx}-${i}`}
                  className={`variant-card-a relative overflow-hidden rounded-xl border border-white/10 shadow-2xl ${
                    i === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                  style={{
                    aspectRatio: i === 0 ? "16/9" : "4/3",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <Image
                    src={src}
                    alt={`Game master ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/2 relative z-20">
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
              {t("gameMaster.subtitle")}
            </span>
            <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
              {t("gameMaster.title")}
            </h2>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              {t("gameMaster.description")}
            </p>
            <ul className="space-y-2 text-white/80 font-serif uppercase text-sm tracking-widest">
              {gameMasterFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-accent">•</span> {feature}
                </li>
              ))}
            </ul>
            <p className="text-white/80 text-lg leading-relaxed mt-6">
              {t("gameMaster.subDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEAST */}
      <section className="py-16 px-4 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2 relative z-10">
            <div
              ref={cardContainerRefs[1]}
              className="grid grid-cols-2 gap-3 perspective-[1200px]"
            >
              {visibleFeastImages.map((src, i) => (
                <div
                  key={`${feastStartIdx}-${i}`}
                  className={`variant-card-a relative overflow-hidden rounded-xl border border-white/10 shadow-2xl ${
                    i === 2 ? "col-span-2 row-span-2" : ""
                  }`}
                  style={{
                    aspectRatio: i === 2 ? "16/9" : "4/3",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <Image
                    src={src}
                    alt={`Feast ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/2 relative z-20">
            <span className="text-accent text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
              {t("feast.subtitle")}
            </span>
            <h2 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-wide mb-6">
              {t("feast.title")}
            </h2>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              {t("feast.descriptionOne")}
            </p>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              {t("feast.descriptionTwo")}
            </p>
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              {t("feast.descriptionThree")}
            </p>
          </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section
        ref={ctaContainerRef}
        className="relative h-[60dvh] min-h-[500px] flex items-center justify-center overflow-hidden border-t border-accent/20"
      >
        <div className="absolute inset-0 -top-[50%] h-[200%] w-full">
          <Image
            ref={ctaImageRef}
            src={PRIVATE_HIRE_CONTENT.cta.image}
            alt=""
            fill
            className="object-cover contrast-125 brightness-90"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div ref={ctaContentRef} className="relative z-10 text-center px-4">
          <h2 className="font-serif text-5xl md:text-7xl font-black uppercase tracking-widest text-white mb-8 drop-shadow-2xl">
            {t("cta.title")}
          </h2>
          <Link href="/book" className="btn btn-primary">
            {t("cta.buttonText")}
          </Link>
        </div>
      </section>
    </div>
  );
}