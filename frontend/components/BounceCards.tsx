"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface BounceCardsProps {
  images: string[];
  className?: string;
  enableHover?: boolean;
}

export default function BounceCards({
  className = "",
  enableHover = false,
  images,
}: BounceCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className={`relative flex items-center justify-center ${className}`}
    >
      {images.map((src, i) => (
        <motion.div
          key={i}
          className="absolute w-48 h-64 md:w-56 md:h-72 rounded-lg overflow-hidden shadow-xl border border-white/10"
          initial={{ opacity: 0, y: 50, rotate: -10 + i * 10 }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  y: 0,
                  rotate: -5 + i * 5,
                  x: (i - (images.length - 1) / 2) * 40,
                }
              : {}
          }
          transition={{
            duration: 0.6,
            delay: i * 0.15,
            ease: "easeOut",
          }}
          whileHover={
            enableHover
              ? { scale: 1.05, zIndex: 10, transition: { duration: 0.2 } }
              : undefined
          }
        >
          <img
            src={src}
            alt={`Daerdree private hire atmosphere ${i + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </motion.div>
      ))}
    </div>
  );
}