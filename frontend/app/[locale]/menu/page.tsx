"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import AnimatedContent from "@/components/AnimatedContent";
import "react-pdf/dist/Page/AnnotationLayer.css"; // Стили для ссылок внутри PDF (если есть)
import "react-pdf/dist/Page/TextLayer.css"; // Стили для выделения текста

// === НАСТРОЙКА ВОРКЕРА ===
// Это критически важно для Next.js, иначе PDF не загрузится
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Путь к твоему PDF в папке public
const PDF_FILE = "/menu/menu.pdf"; 

export default function MenuPage() {
  const [numPages, setNumPages] = useState<number | null>(null);

  // Колбэк, который срабатывает, когда PDF загрузился и мы узнали кол-во страниц
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <AnimatedContent distance={20} direction="vertical">
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase tracking-widest text-accent mb-4">
              Drinks & Spirits
            </h1>
            <p className="font-sans text-white/50 text-lg">
              Crafted cocktails and legendary spirits
            </p>
          </AnimatedContent>
        </div>

        {/* PDF КОНТЕЙНЕР */}
        <div className="flex justify-center">
          <AnimatedContent 
            distance={40} 
            direction="vertical" 
            className="max-w-lg md:max-w-xl w-full"
          >
            <div className="flex flex-col w-full bg-neutral-900 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden min-h-[500px] relative">
              
              <Document
                file={PDF_FILE}
                onLoadSuccess={onDocumentLoadSuccess}
                className="flex flex-col items-center"
                loading={
                  <div className="text-white/50 p-10">Загрузка меню...</div>
                }
                error={
                  <div className="text-red-500 p-10">Не удалось загрузить PDF.</div>
                }
              >
                {/* Рендерим все страницы по очереди */}
                {numPages && Array.from(new Array(numPages), (el, index) => (
                  <div key={`page_${index + 1}`} className="w-full relative">
                     <Page 
                        pageNumber={index + 1} 
                        // width={600} // Можно задать жесткую ширину или использовать CSS
                        className="w-full h-auto"
                        renderTextLayer={false} // Если не нужно выделять текст (для скорости)
                        renderAnnotationLayer={false} // Если нет ссылок внутри PDF
                        width={576} // Примерная ширина max-w-xl (576px) для четкости
                     />
                     {/* Разделитель (опционально) */}
                     {/* {index + 1 !== numPages && (
                        <div className="w-full h-[1px] bg-black/10" />
                     )} */}
                  </div>
                ))}
              </Document>

            </div>
          </AnimatedContent>
        </div>
      </div>
    </main>
  );
}