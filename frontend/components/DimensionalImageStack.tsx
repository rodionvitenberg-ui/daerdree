
import { useRef, useEffect, useState, useCallback } from "react";
import Image from "@/components/AppImage";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface DimensionalImageStackProps {
  images: string[];
  className?: string;
  containerHeight?: number;
}

export default function DimensionalImageStack({
  images,
  className = "",
  containerHeight = 580,
}: DimensionalImageStackProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [isHovering, setIsHovering] = useState(false);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const CARD_WIDTH = 316;
  const CARD_HEIGHT = 460;

  // ——— Entrance ———
  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(cards, { opacity: 0, y: 80, scale: 0.7, rotationY: 45 });
      gsap.to(cards, {
        opacity: 1, y: 0, scale: 1, rotationY: 0,
        duration: 0.9, ease: "power3.out", stagger: 0.15,
        scrollTrigger: { trigger: section, start: "top 82%", once: true },
      });
      updateLayout(false);
    }, section);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // ——— Layout with sequential stagger ———
  const updateLayout = useCallback(
    (animate: boolean) => {
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      const total = cards.length;
      const center = activeIndexRef.current;
      if (total === 0) return;

      cards.forEach((card, i) => {
        const absOffset = Math.abs(i - center);
        gsap.set(card, { zIndex: total - absOffset, opacity: 1 - absOffset * 0.15 });
      });

      const tl = gsap.timeline();
      const ordered = cards
        .map((card, i) => ({ card, i, dist: Math.abs(i - center) }))
        .sort((a, b) => a.dist - b.dist);

      ordered.forEach(({ card, i, dist }) => {
        const offset = i - center;
        const absOffset = Math.abs(offset);
        const scale = 1 - absOffset * 0.12;
        const rotateY = offset * 12;
        const zOffset = -absOffset * 120;
        const xOffset = offset * (offset > 0 ? 110 : -110);
        const vars = {
          x: xOffset, scale: Math.max(scale, 0.5),
          rotationY: rotateY, z: zOffset,
          duration: animate ? 0.7 : 0, ease: "power3.out",
        };
        if (animate) tl.to(card, vars, dist * 0.08);
        else gsap.set(card, vars);
      });
      if (animate) tl.play();
    },
    []
  );

  useEffect(() => { updateLayout(true); }, [activeIndex]); // eslint-disable-line

  // ——— Mouse parallax ———
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    mouseXRef.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseYRef.current = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const track = trackRef.current;
        if (!track) { rafRef.current = null; return; }
        gsap.to(track, { rotateX: -mouseYRef.current * 3, rotateY: mouseXRef.current * 3, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        rafRef.current = null;
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (trackRef.current) {
      gsap.to(trackRef.current, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power2.out" });
    }
  }, []);

  useEffect(() => { return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }; }, []);

  // ——— Click handler ———
  const handleCardClick = (index: number) => {
    const current = activeIndexRef.current;
    if (index === current) setActiveIndex((prev) => (prev + 1) % images.length);
    else setActiveIndex(index);
  };

  // ——— Mobile ———
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const handleScroll = () => setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className={`relative w-full ${className}`}>
      {/* DESKTOP: 3D Coverflow */}
      <div className="hidden md:flex flex-col items-center justify-center w-full select-none"
        style={{ height: containerHeight, perspective: "900px" }}>
        
        {/* Clickable side zones */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          <button
            className="absolute left-0 top-0 h-full w-[22%] z-30 cursor-pointer"
            onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
            aria-label="Previous image"
          />
          <button
            className="absolute right-0 top-0 h-full w-[22%] z-30 cursor-pointer"
            onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
            aria-label="Next image"
          />

          <div ref={trackRef} className="relative flex items-center justify-center"
            style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseMove={isHovering ? handleMouseMove : undefined}
            onMouseLeave={handleMouseLeave}>
            {images.map((src, i) => (
              <div key={i} ref={(el) => { cardsRef.current[i] = el; }}
                className="absolute cursor-pointer select-none"
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transformStyle: "preserve-3d", backfaceVisibility: "hidden",
                  zIndex: images.length - Math.abs(i - activeIndex), opacity: 0 }}
                onClick={() => handleCardClick(i)}>
                <div className="relative w-full h-full overflow-hidden rounded-lg border border-white/10 shadow-2xl">
                  <Image src={src} alt={`Gallery ${i + 1}`} fill className="object-cover pointer-events-none" sizes={`${CARD_WIDTH}px`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots — BELOW the cards */}
        <div className="flex justify-center gap-2 pb-8 pt-4">
          {images.map((_, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${i === activeIndex ? "w-8 bg-accent" : "bg-white/20 hover:bg-white/40"}`}
              aria-label={`Go to image ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* MOBILE */}
      <div className="block md:hidden w-full">
        <div ref={mobileScrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory w-full scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {images.map((src, i) => (
            <div key={i} className="relative shrink-0 w-[85vw] h-[60dvh] snap-center rounded-lg overflow-hidden border border-white/10">
              <Image src={src} alt={`Gallery ${i + 1}`} fill className="object-cover" sizes="85vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === mobileIndex ? "w-6 bg-accent" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}