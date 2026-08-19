"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from '@/components/AppImage';
import { BOOKING_CONTENT } from '@/content/home';
import { useTranslations, useLocale } from 'next-intl';
import DateTimeField from '@/components/ui/date-time-field';

function BookingContent() {
  const t = useTranslations("Booking");
  const locale = useLocale();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dateValue, setDateValue] = useState('');

  const searchParams = useSearchParams();
  const eventTitle = searchParams.get('event');
  const eventDateRaw = searchParams.get('date');

  let defaultDate = '';
  if (eventDateRaw) {
    try {
      defaultDate = new Date(eventDateRaw).toISOString().slice(0, 16);
    } catch (e) {
      console.error("Invalid date format in URL", e);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus('error');
    }
  };

  return (
    <section id="booking" className="relative z-10 w-full border-b border-white/5 bg-background">
      
      <div className="flex flex-col lg:flex-row lg:min-h-dvh">
        
        {/* 1. ИЗОБРАЖЕНИЕ */}
        <div className="relative h-[50dvh] min-h-[280px] w-full lg:h-auto lg:min-h-dvh lg:w-[67%]">
          <Image
            src={BOOKING_CONTENT.image}
            alt="Booking Atmosphere"
            fill
            className="object-cover contrast-135"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pb-32 text-center lg:pb-6">
            <h2 className="font-serif text-3xl font-black uppercase tracking-widest text-white drop-shadow-lg lg:text-6xl">
              {t("title")}
            </h2>
            <p className="mt-2 font-sans text-lg text-gray-200 lg:max-w-md">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* 2. ФОРМА ИЛИ СООБЩЕНИЕ ОБ УСПЕХЕ */}
        <div className="relative z-10 w-full bg-background lg:h-full lg:w-[33.5%]">
            
            <div className="-mt-20 flex flex-col justify-center bg-background px-6 py-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 lg:mt-0 lg:h-full lg:rounded-none lg:px-12 lg:shadow-none">
                
                {status === 'success' ? (
                   <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="mb-2 font-serif text-3xl font-bold uppercase text-white">{t("success.title")}</h3>
                      <p className="mb-8 text-white/60">
                        {t("success.description")}
                      </p>
                      <button 
                        onClick={() => setStatus('idle')}
                        className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors"
                      >
                        {t("success.button")}
                      </button>
                   </div>
                ) : (
                <>
                  {eventTitle && (
                    <div className="mb-6 flex flex-col justify-center rounded-r-sm border-l-2 border-secondary bg-white/5 p-4 animate-in fade-in slide-in-from-top-4">
                        <span className="text-secondary mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                          {t("eventSelected")}
                        </span>
                        <span className="font-serif text-xl tracking-wide text-white">
                          {eventTitle}
                        </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      
                      {eventTitle && <input type="hidden" name="event_title" value={eventTitle} />}
                      <input type="hidden" name="date" value={dateValue || defaultDate} />

                      {status === 'error' && (
                          <div className="rounded bg-red-500/10 p-3 border border-red-500/20 text-center text-sm text-red-400">
                              {t("error")}
                          </div>
                      )}

                      <div className="group">
                          <label htmlFor="booking-name" className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                              {t("form.nameLabel")}
                          </label>
                          <input 
                              id="booking-name"
                              required
                              type="text" 
                              name="name"
                              autoComplete="name"
                              enterKeyHint="next"
                              disabled={status === 'loading'}
                              placeholder={t("form.namePlaceholder")}
                              className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                          />
                      </div>

                      <div className="group">
                          <label htmlFor="booking-guests" className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                              {t("form.guestsLabel")}
                          </label>
                          <input 
                              id="booking-guests"
                              required
                              type="number" 
                              name="guests"
                              min={1}
                              inputMode="numeric"
                              enterKeyHint="next"
                              disabled={status === 'loading'}
                              placeholder={t("form.guestsPlaceholder")}
                              className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                          />
                      </div>

                      <div className="group">
                          <label htmlFor="booking-date" className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                              {t("form.dateLabel")}
                          </label>
                          <DateTimeField
                              id="booking-date"
                              value={dateValue || defaultDate}
                              disabled={status === 'loading'}
                              locale={locale === 'en' ? 'en-US' : 'ru-RU'}
                              onChange={(value) => setDateValue(value)}
                          />
                      </div>

                      <div className="group">
                          <label htmlFor="booking-contact" className="mb-2 block font-serif text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-secondary">
                              {t("form.contactLabel")}
                          </label>
                          <input 
                              id="booking-contact"
                              required
                              type="text" 
                              name="contact"
                              autoComplete="tel"
                              enterKeyHint="done"
                              disabled={status === 'loading'}
                              placeholder={t("form.contactPlaceholder")}
                              className="w-full border-b border-white/20 bg-transparent py-2 text-lg text-foreground outline-none transition-colors focus:border-secondary placeholder:text-white/20 disabled:opacity-50"
                          />
                      </div>

                      <button 
                          type="submit" 
                          disabled={status === 'loading'}
                          className="btn btn-inverse mt-8 w-full"
                      >
                          {status === 'loading' && (
                              <svg className="h-5 w-5 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                          )}
                          {status === 'loading' ? t("form.sending") : t("form.submit")}
                      </button>
                  </form>
                </>
                )}

                <div className="my-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="font-serif text-xs text-gray-500">{t("socialsDivider")}</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex justify-center gap-4">
                    <a href={BOOKING_CONTENT.socials.telegram} target="_blank" aria-label="Telegram" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-blue-400 hover:text-blue-400">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.319.014.096.008.192.001.277z"/></svg>
                    </a>
                    <a href={BOOKING_CONTENT.socials.instagram} target="_blank" aria-label="Instagram" className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-pink-500 hover:text-pink-500">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                </div>

            </div>
        </div>
      </div>

    </section>
  );
}

export default function Booking() {
  return (
    <Suspense fallback={<div className="min-h-dvh w-full bg-neutral-950" />}>
      <BookingContent />
    </Suspense>
  );
}