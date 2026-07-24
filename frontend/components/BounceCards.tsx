"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

interface BounceCardsProps {
  images: string[];
  className?: string;
  enableHover?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  transformStyles?: string[];
}

export default function BounceCards({
  className = "",
  enableHover = false,
  images,
  containerWidth = 500,
  containerHeight = 400,
  transformStyles = [],
}: BounceCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const cards = cardsRef.current.filter(Boolean);
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const x = (i - (images.length - 1) / 2) * 40;
        const rotate = -5 + i * 5;

        gsap.fromTo(
          card,
          { opacity: 0, y: 50, rotation: -10 + i * 10 },
          {
            opacity: 1,
            y: 0,
            x,
            rotation: rotate,
            duration: 0.6,
            delay: i * 0.15,
            ease: "power2.out",
          }
        );
      });
    }, ref);

    return () => ctx.revert();
  }, [isInView, images.length]);

  return (
    <div
      ref={ref}
      style={{ width: containerWidth, height: containerHeight }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {images.map((src, i) => {
        const initialTransform = transformStyles[i] || `rotate(${-10 + i * 10}deg) translateX(${(i - (images.length - 1) / 2) * 40}px)`;

        return (
          <div
            key={i}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="absolute w-48 h-64 md:w-56 md:h-72 rounded-lg overflow-hidden shadow-xl border border-white/10"
            style={{ opacity: 0 }}
            onMouseEnter={
              enableHover ? (e) => {
                gsap.to(e.currentTarget, { scale: 1.05, zIndex: 10, duration: 0.2 });
              } : undefined
            }
            onMouseLeave={
              enableHover ? (e) => {
                gsap.to(e.currentTarget, { scale: 1, zIndex: 0, duration: 0.2 });
              } : undefined
            }
          >
            <img
              src={src}
              alt={`Daerdree private hire atmosphere ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}