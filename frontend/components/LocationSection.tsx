"use client";

import Link from "next/link";
import { LOCATION_CONTENT } from "@/content/home";
import AnimatedContent from "./AnimatedContent";
import { useTranslations } from "next-intl";

export default function LocationSection() {
  const t = useTranslations("LocationSection");

  const TitleBlock = () => (
    <AnimatedContent distance={20} direction="vertical">
      <h2 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-widest text-accent mb-2">
        {t("title")}
      </h2>
      <p className="font-sans text-white/50 text-lg">
        {t("subtitle")}
      </p>
    </AnimatedContent>
  );

  return (
    // ИСПРАВЛЕНИЕ: Добавлен overflow-hidden вот здесь 👇
    <section className="w-full overflow-hidden bg-background py-20">
      <div className="container mx-auto px-4">
        
        <div className="block lg:hidden mb-10 text-center">
           <TitleBlock />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            
            <div className="hidden lg:block">
               <TitleBlock />
            </div>

            <div className="w-full h-[1px] bg-white/10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <AnimatedContent distance={20} direction="vertical" delay={0.1}>
                <h3 className="text-white font-serif text-xl uppercase tracking-wider mb-4">
                  {t("locationTitle")}
                </h3>
                <p className="text-gray-300 font-sans text-lg leading-relaxed">
                  {t("street")}<br />
                  {t("city")}
                </p>
                <a 
                  href={LOCATION_CONTENT.address.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-accent border-b border-accent/30 pb-1 hover:text-white hover:border-white transition-colors text-sm uppercase tracking-widest"
                >
                  {t("findOnMap")}
                </a>
              </AnimatedContent>

              <AnimatedContent distance={20} direction="vertical" delay={0.2}>
                <h3 className="text-white font-serif text-xl uppercase tracking-wider mb-4">
                  {t("contactsTitle")}
                </h3>
                <ul className="text-gray-300 font-sans space-y-2">
                  <li>
                    <a href={`tel:${LOCATION_CONTENT.contact.phone}`} className="hover:text-accent transition-colors">
                      {LOCATION_CONTENT.contact.phone}
                    </a>
                  </li>
                  <li>
                    <a 
                      href={`https://t.me/${LOCATION_CONTENT.contact.telegram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-accent transition-colors"
                    >
                      {LOCATION_CONTENT.contact.telegram}
                    </a>
                  </li>
                </ul>
              </AnimatedContent>

            </div>

          </div>

          <AnimatedContent distance={50} direction="horizontal" delay={0.2} className="h-full w-full order-1 lg:order-2">
            <div className="relative w-full h-[400px] lg:h-[563px] overflow-hidden shadow-2xl bg-neutral-800 border border-white/10 group">
              
              <iframe
                src={LOCATION_CONTENT.mapEmbedUrl}
                title="Daerdree Bar & Timeclub on Google Maps"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen={false}
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale invert contrast-[0.85] opacity-80 transition-all duration-700 group-hover:grayscale-0 group-hover:invert-0 group-hover:opacity-100 group-hover:contrast-100"
              />
              
              <div className="absolute inset-0 bg-indigo-900/20 pointer-events-none mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700" />

            </div>
          </AnimatedContent>

        </div>
      </div>
    </section>
  );
}