'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDatePart(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : '';
}

function toTimePart(value: string): string {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match ? match[1] : '';
}

function formatDisplay(value: string, locale: string): string {
  const datePart = toDatePart(value);
  if (!datePart) return '';
  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const dateText = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = toTimePart(value);
  return time ? `${dateText}, ${time}` : dateText;
}

export default function DateTimeField({
  id,
  value,
  onChange,
  disabled = false,
  locale = 'ru-RU',
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  locale?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const datePart = toDatePart(value);
  const selectedDate = datePart ? new Date(`${datePart}T00:00:00`) : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const next = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    onChange(toTimePart(value) ? `${next}T${toTimePart(value)}` : `${next}T12:00`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          disabled={disabled}
          className="flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm text-white outline-none transition-colors hover:border-[hsl(187,83%,26%)]/50 focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
        >
          <span className={cn('truncate', !value && 'text-white/40')}>
            {value ? formatDisplay(value, locale) : 'Выберите дату'}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-white/40" />
        </button>
        <input
          type="time"
          value={toTimePart(value)}
          disabled={disabled}
          onChange={(event) => {
            const time = event.target.value;
            onChange(datePart ? `${datePart}T${time || '12:00'}` : '');
          }}
          aria-label="Время"
          className="h-11 w-32 rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50 [color-scheme:dark]"
        />
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect as (date: Date | undefined) => void}
            locale={locale}
            weekStartsOn={1}
            className="shadow-xl"
          />
        </div>
      ) : null}
    </div>
  );
}