"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ExpansionAccordionProps {
  title: string;
  description: string;
}

export default function ExpansionAccordion({ title, description }: ExpansionAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors hover:border-white/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left outline-none"
      >
        {/* Крупный шрифт для названия дополнения */}
        <span className="font-serif text-xl md:text-2xl font-bold text-white transition-colors group-hover:text-accent">
          {title}
        </span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
          <ChevronDown 
            className={`h-5 w-5 text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} 
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-2">
              {/* Если в описании дополнений тоже будет HTML из CKEditor, используем dangerouslySetInnerHTML */}
              {description ? (
                <div 
                  className="prose prose-invert max-w-none text-white/70"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-white/50 italic">Нет описания</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}