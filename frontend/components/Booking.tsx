"use client";

import Image from 'next/image';
import { BOOKING_CONTENT } from '@/content/home';

export default function Booking() {
  
  // Заглушка для отправки формы (потом подключим бота)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Logic for Telegram Bot will be here!");
  };

  return (
    // ID нужен, чтобы кнопка из Хедера скроллила сюда
    <section id="booking" className="relative w-full bg-background">
      
      {/* --- DESKTOP LAYOUT (FLEX) --- */}
      <div className="flex flex-col lg:flex-row lg:h-screen">
        
        {/* 1. ИЗОБРАЖЕНИЕ (Desktop: 70%, Mobile: Сверху) */}
        <div className="relative h-[50vh] w-full lg:h-full lg:w-[67%]">
          <Image
            src={BOOKING_CONTENT.image}
            alt="Booking Atmosphere"
            fill
            className="object-cover"
          />
          {/* Затемнение, чтобы текст читался */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Текст на картинке (Заголовок) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 lg:items-start lg:justify-end lg:p-16 lg:text-left">
            <h2 className="font-serif text-4xl font-black uppercase tracking-widest text-white drop-shadow-lg lg:text-6xl">
              {BOOKING_CONTENT.title}
            </h2>
            <p className="mt-2 font-sans text-lg text-gray-200 lg:max-w-md">
              {BOOKING_CONTENT.subtitle}
            </p>
            {/* На десктопе текст остается на картинке слева внизу. 
                На мобилке он будет по центру картинки, а форма наедет на него снизу. 
            */}
          </div>
        </div>

        {/* 2. ФОРМА (Desktop: 30%, Mobile: Карточка с наложением) */}
        <div className="relative z-10 w-full lg:w-[33.5%] lg:h-full bg-background">
            
            {/* MOBILE TRICK: 
               -mt-20 (отрицательный отступ) поднимает блок вверх на 80px
               rounded-t-3xl делает верхние углы круглыми, как у шторки
            */}
            <div className="-mt-20 flex flex-col justify-center bg-background px-6 py-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:mt-0 lg:h-full lg:rounded-none lg:shadow-none lg:px-12">
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Поля формы. Сделаем их стильными, "под черту" */}
                    
                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-accent">
                            Name
                        </label>
                        <input 
                            type="text" 
                            placeholder={BOOKING_CONTENT.form.namePlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-accent placeholder:text-white/20"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-accent">
                            Guests
                        </label>
                        <input 
                            type="number" 
                            placeholder={BOOKING_CONTENT.form.guestsPlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-accent placeholder:text-white/20"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-accent">
                            Date
                        </label>
                        <input 
                            type="text" // Можно заменить на type="datetime-local" но его сложно стилизовать
                            placeholder={BOOKING_CONTENT.form.datePlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-accent placeholder:text-white/20"
                        />
                    </div>

                    <div className="group">
                        <label className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-accent">
                            Contact
                        </label>
                        <input 
                            type="text" 
                            placeholder={BOOKING_CONTENT.form.contactPlaceholder}
                            className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-accent placeholder:text-white/20"
                        />
                    </div>

                    {/* Кнопка отправки */}
                    <button type="submit" className="mt-8 w-full bg-white py-4 font-serif font-bold uppercase tracking-widest text-black transition-transform hover:scale-[1.02] hover:bg-gray-200">
                        {BOOKING_CONTENT.form.buttonText}
                    </button>
                </form>

                {/* Разделитель */}
                <div className="my-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="font-serif text-xs text-gray-500">OR REACH US VIA</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Соцсети */}
                <div className="flex justify-center gap-6">
                    <a href={BOOKING_CONTENT.socials.whatsapp} target="_blank" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-green-500 hover:text-green-500">
                        {/* WhatsApp Icon */}
                        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>

                     <a href={BOOKING_CONTENT.socials.instagram} target="_blank" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-pink-500 hover:text-pink-500">
                        {/* Instagram Icon */}
                        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                </div>

            </div>
        </div>
      </div>

    </section>
  );
}