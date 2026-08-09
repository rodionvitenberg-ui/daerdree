"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Инерционный (ленивый) скролл через Lenis.
 * Уже в dependencies, но не использовался. Интегрирован с GSAP ScrollTrigger,
 * чтобы все scroll-анимации (параллаксы, reveal) продолжали работать корректно.
 * Полностью отключается при prefers-reduced-motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Останавливаем инерционный скролл на время открытого мобильного меню.
    // Header вешает класс nav-open на body; без этого window.scrollTo(0,0)
    // конфликтует с внутренним скроллом Lenis.
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("nav-open")) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
