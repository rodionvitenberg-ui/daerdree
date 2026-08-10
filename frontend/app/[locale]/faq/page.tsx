"use client";

import Image from "@/components/AppImage";
import { faqData } from "@/content/faq"; 
import Link from "next/link";
import { useTranslations } from "next-intl"; // Подключаем хук

// Описываем интерфейс элемента, который вернет t.raw()
interface FAQItem {
  question?: string;
  answer: string | string[];
  list?: string[];
}

export default function FAQPage() {
  const t = useTranslations("FAQPage");

  return (
    <div className="min-h-dvh w-full bg-black text-white pt-24 pb-20">
      
      {/* HEADER */}
      <section className="container mx-auto px-4 mb-20 text-center">
        <h1 className="font-serif text-5xl lg:text-7xl font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
          {t("title_1")}<br className="lg:hidden"/> {t("title_2")}<br className="lg:hidden"/> {t("title_3")}
        </h1>
      </section>

      {/* FAQ BLOCKS */}
      <div className="flex flex-col gap-0">
        {faqData.map((block, index) => {
          const isEven = index % 2 === 0;

          // Динамически получаем элементы именно для этого блока (по его ID) из JSON
          const items = t.raw(`blocks.${block.id}.items`) as FAQItem[];
          
          // Проверяем, есть ли текст для кнопки
          const ctaText = block.cta ? t(`blocks.${block.id}.ctaText`) : null;

          return (
            <section 
              key={block.id} 
              className={`w-full min-h-[80dvh] flex flex-col lg:flex-row overflow-hidden ${
                !isEven ? 'lg:flex-row-reverse' : ''
              }`}
            >
              
              {/* IMAGE SIDE */}
              <div className="relative w-full lg:w-1/2 h-[50dvh] lg:h-auto min-h-[400px]">
                <Image
                  src={block.image}
                  alt="FAQ Illustration"
                  fill
                  className="object-cover opacity-60"
                />
                <div className={`absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-black via-transparent to-transparent opacity-80 ${
                    !isEven ? 'lg:bg-gradient-to-l' : ''
                }`} />
              </div>

              {/* CONTENT SIDE */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-20 bg-black/50 backdrop-blur-sm z-10">
                <div className="max-w-xl mx-auto lg:mx-0">
                  
                  {items.map((item, i) => (
                    <div 
                      key={i}
                      className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700"
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                    >
                      {item.question && (
                        <h3 className="text-xl lg:text-2xl font-serif font-bold text-accent mb-4">
                          {item.question}
                        </h3>
                      )}
                      
                      <div className="text-white/80 leading-relaxed space-y-4">
                        {Array.isArray(item.answer) ? (
                          item.answer.map((par, pIdx) => <p key={pIdx}>{par}</p>)
                        ) : (
                          <p>{item.answer}</p>
                        )}

                        {item.list && (
                          <ul className="list-disc pl-5 space-y-2 mt-4 text-white/70">
                            {item.list.map((li, lIdx) => (
                              <li key={lIdx}>{li}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* CTA / Extra Elements */}
                  {block.cta && ctaText && (
                    <div className="mt-12 pt-8 animate-in fade-in duration-700">
                      {block.cta.link ? (
                        <Link 
                          href={block.cta.link} 
                          target="_blank"
                          className="flex items-center gap-3 text-accent hover:text-white transition-colors group"
                        >
                          {block.cta.icon === 'telegram' && (
                            <div className="w-8 h-8 rounded-full border border-accent flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-all">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c.564-5.811 2.233-11.425 2.233-11.425.074-.539-.371-.856-.848-.569-4.707 2.822-9.613 5.759-9.613 5.759-.65.344-.658.918.066 1.18 2.016.732 4.417 1.574 4.417 1.574 1.258 4.292 2.661 7.214 2.661 7.214.37.79 1.084.582 1.084.582z"/></svg>
                            </div>
                          )}
                          <span className="font-serif uppercase tracking-widest text-sm font-bold">
                            {ctaText}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex flex-col items-center lg:items-start gap-4 text-accent">
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </section>
          );
        })}
      </div>
    </div>
  );
}