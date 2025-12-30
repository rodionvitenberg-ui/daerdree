"use client";

import Link from "next/link";
import { LOCATION_CONTENT } from "@/content/home";
import AnimatedContent from "./AnimatedContent";

export default function LocationSection() {
  
  // Выносим блок заголовка в переменную, чтобы не дублировать код вручную
  const TitleBlock = () => (
    <AnimatedContent distance={20} direction="vertical">
      <h2 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-widest text-accent mb-2">
        {LOCATION_CONTENT.title}
      </h2>
      <p className="font-sans text-white/50 text-lg">
        {LOCATION_CONTENT.subtitle}
      </p>
    </AnimatedContent>
  );

  return (
    <section className="w-full bg-background py-20">
      <div className="container mx-auto px-4">
        
        {/* === 1. ЗАГОЛОВОК ДЛЯ МОБИЛЬНЫХ (ВИДЕН ТОЛЬКО ДО lg) === */}
        {/* Он стоит ВНЕ сетки, поэтому всегда будет сверху */}
        <div className="block lg:hidden mb-10 text-center">
           <TitleBlock />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* === 2. ИНФОРМАЦИЯ (КОНТАКТЫ) === */}
          {/* order-2 на мобилке (чтобы быть ПОД картой) */}
          {/* lg:order-1 на десктопе (чтобы быть СЛЕВА) */}
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            
            {/* ЗАГОЛОВОК ДЛЯ ДЕСКТОПА (ВИДЕН ТОЛЬКО ОТ lg) */}
            {/* Внутри колонки, чтобы выравниваться с текстом */}
            <div className="hidden lg:block">
               <TitleBlock />
            </div>

            {/* Разделитель */}
            <div className="w-full h-[1px] bg-white/10" />

            {/* Адрес и Контакты */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Адрес */}
              <AnimatedContent distance={20} direction="vertical" delay={0.1}>
                <h3 className="text-white font-serif text-xl uppercase tracking-wider mb-4">Location</h3>
                <p className="text-gray-300 font-sans text-lg leading-relaxed">
                  {LOCATION_CONTENT.address.street}<br />
                  {LOCATION_CONTENT.address.city}
                </p>
                <a 
                  href={LOCATION_CONTENT.address.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-accent border-b border-accent/30 pb-1 hover:text-white hover:border-white transition-colors text-sm uppercase tracking-widest"
                >
                  Get Directions
                </a>
              </AnimatedContent>

              {/* Контакты */}
              <AnimatedContent distance={20} direction="vertical" delay={0.2}>
                <h3 className="text-white font-serif text-xl uppercase tracking-wider mb-4">Contact</h3>
                <ul className="text-gray-300 font-sans space-y-2">
                  <li>
                    <a href={`tel:${LOCATION_CONTENT.contact.phone}`} className="hover:text-accent transition-colors">
                      {LOCATION_CONTENT.contact.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${LOCATION_CONTENT.contact.email}`} className="hover:text-accent transition-colors">
                      {LOCATION_CONTENT.contact.email}
                    </a>
                  </li>
                  <li>
                    <span className="text-white/50">{LOCATION_CONTENT.contact.instagram}</span>
                  </li>
                </ul>
              </AnimatedContent>

            </div>

            {/* Часы работы */}
            <AnimatedContent distance={20} direction="vertical" delay={0.3}>
              {/* Убрал rounded, оставил твои границы */}
              <div className="bg-neutral-900 p-6 md:p-8 border border-white/5">
                <h3 className="text-white font-serif text-xl uppercase tracking-wider mb-6">Opening Hours</h3>
                <ul className="space-y-4">
                  {LOCATION_CONTENT.hours.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-gray-300 font-sans pb-2 last:pb-0">
                      <span>{item.day}</span>
                      <span className="text-white font-bold">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContent>

          </div>

          {/* === 3. КАРТА === */}
          {/* order-1 на мобилке (чтобы быть СРАЗУ ПОСЛЕ мобильного заголовка) */}
          {/* lg:order-2 на десктопе (чтобы быть СПРАВА) */}
          <AnimatedContent distance={50} direction="horizontal" delay={0.2} className="h-full w-full order-1 lg:order-2">
            {/* Убрал скругления (rounded), оставил твои стили */}
            <div className="relative w-full h-[400px] lg:h-[600px] overflow-hidden shadow-2xl bg-neutral-800 border border-white/10 group">
              
              <iframe
                src={LOCATION_CONTENT.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale invert contrast-[0.85] opacity-80 transition-all duration-700 group-hover:grayscale-0 group-hover:invert-0 group-hover:opacity-100 group-hover:contrast-100"
              />
              
              <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700" />
              
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur text-white text-xs px-3 py-1 uppercase tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Interact with map
              </div>

            </div>
          </AnimatedContent>

        </div>
      </div>
    </section>
  );
}