"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BOOKING_CONTENT } from '@/content/home';

// === НАСТРОЙКА КАРУСЕЛИ ===
const CAROUSEL_IMAGES = [
  BOOKING_CONTENT.image, // 1. Основная
  "/hero-bg.jpg",        // 2. Вторая
  "/catering/1.jpg",     // 3. Третья
];

export default function BookPage() {
  // Заменяем простой isSubmitting на полноценный статус
  // 'idle' (обычное), 'loading' (отправка), 'success' (успех), 'error' (ошибка)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Состояние для индекса текущей картинки
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Логика смены слайдов
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === CAROUSEL_IMAGES.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading'); // Включаем загрузку

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus('success'); // Показываем экран успеха
        // Форму не сбрасываем, она просто исчезнет
      } else {
        setStatus('error'); // Показываем ошибку
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus('error');
    }
  };

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <main className="min-h-screen bg-background pt-20 lg:pt-0"> 
      <div className="flex flex-col lg:flex-row lg:h-screen">
        
        {/* 1. ЛЕВАЯ ЧАСТЬ: СЛАЙДЕР (Без изменений) */}
        <div className="relative h-[40vh] w-full lg:h-full lg:w-[67%] overflow-hidden bg-black">
          {CAROUSEL_IMAGES.map((src, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={src}
                alt={`Atmosphere ${index}`}
                fill
                className="object-cover"
                unoptimized={isDev}
                priority={index === 0} 
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/40 z-20 pointer-events-none" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-30 pointer-events-none">
            <h1 className="font-serif text-4xl font-black uppercase tracking-widest text-white drop-shadow-2xl lg:text-6xl">
              {BOOKING_CONTENT.title}
            </h1>
            <p className="mt-4 font-sans text-lg text-gray-200 lg:max-w-md drop-shadow-md">
              {BOOKING_CONTENT.subtitle}
            </p>
          </div>
        </div>

        {/* 2. ПРАВАЯ ЧАСТЬ: ФОРМА или УСПЕХ */}
        <div className="relative z-10 w-full lg:w-[33.5%] lg:h-full bg-background flex flex-col justify-center">
            
            <div className="-mt-10 lg:mt-0 px-6 py-12 lg:px-12 bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none rounded-t-3xl lg:rounded-none border-t border-white/10 lg:border-t-0 transition-all duration-500">
                
                {/* ЛОГИКА: Если УСПЕХ -> показываем сообщение, ИНАЧЕ -> форму */}
                {status === 'success' ? (
                   <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 py-10">
                      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-3xl font-bold uppercase text-white mb-4">Request Sent!</h3>
                      <p className="text-white/60 mb-8 max-w-xs mx-auto">
                        Thank you for your request. We will contact you shortly to confirm your booking.
                      </p>
                      <button 
                        onClick={() => setStatus('idle')}
                        className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors border-b border-secondary/30 hover:border-white pb-1"
                      >
                        Send another request
                      </button>
                   </div>
                ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* Плашка ошибки */}
                    {status === 'error' && (
                        <div className="rounded bg-red-500/10 p-3 border border-red-500/20 text-center text-sm text-red-400 mb-2">
                            Something went wrong. Please try again or contact us via WhatsApp.
                        </div>
                    )}

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                            Name
                        </label>
                        <input 
                            required
                            type="text" 
                            name="name"
                            disabled={status === 'loading'}
                            placeholder={BOOKING_CONTENT.form.namePlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                            Guests
                        </label>
                        <input 
                            required
                            type="number" 
                            name="guests"
                            disabled={status === 'loading'}
                            placeholder={BOOKING_CONTENT.form.guestsPlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                            Date
                        </label>
                        <input 
                            required
                            type="text" 
                            name="date"
                            disabled={status === 'loading'}
                            placeholder={BOOKING_CONTENT.form.datePlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                            Contact
                        </label>
                        <input 
                            required
                            type="text" 
                            name="contact"
                            disabled={status === 'loading'}
                            placeholder={BOOKING_CONTENT.form.contactPlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        className="mt-8 w-full bg-white py-4 font-serif font-bold uppercase tracking-widest text-black transition-transform hover:scale-[1.02] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {status === 'loading' && (
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {status === 'loading' ? "SENDING..." : BOOKING_CONTENT.form.buttonText}
                    </button>
                </form>
                )}

                {/* Разделитель */}
                <div className="my-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="font-serif text-xs text-gray-500">OR REACH US VIA</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Соцсети */}
                <div className="flex justify-center gap-4">
                    {/* WhatsApp */}
                    <a href={BOOKING_CONTENT.socials.whatsapp} target="_blank" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-green-500 hover:text-green-500">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                    {/* Telegram */}
                    <a href={BOOKING_CONTENT.socials.telegram} target="_blank" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-blue-400 hover:text-blue-400">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.319.014.096.008.192.001.277z"/></svg>
                    </a>
                     {/* Instagram */}
                     <a href={BOOKING_CONTENT.socials.instagram} target="_blank" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-pink-500 hover:text-pink-500">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                </div>

            </div>
        </div>
      </div>

    </main>
  );
}