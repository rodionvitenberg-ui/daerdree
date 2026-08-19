"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DateTimeField from "@/components/ui/date-time-field";
import {
  AdminApiError,
  adminFieldErrors,
  getBooking,
  patchBooking,
  type AdminBooking,
  type BookingStatus,
  type BookingWrite,
} from "@/lib/admin-api";

const INPUT =
  "w-full rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40";
const BTN =
  "rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60";
const BTN_GHOST =
  "rounded-md border border-white/[0.08] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] disabled:opacity-60";
const BTN_REJECT =
  "rounded-md border border-[hsl(357,100%,55%)]/40 px-4 py-2.5 text-sm font-semibold text-[hsl(357,100%,70%)] transition-colors hover:border-[hsl(357,100%,55%)] disabled:opacity-60";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "На рассмотрении",
  confirmed: "Подтверждено",
  rejected: "Отклонено",
};

type FormState = {
  name: string;
  contact: string;
  date: string;
  guests: string;
  event_title: string;
  status: BookingStatus;
};

function emptyForm(): FormState {
  return {
    name: "",
    contact: "",
    date: "",
    guests: "",
    event_title: "",
    status: "pending",
  };
}

function fromBooking(booking: AdminBooking): FormState {
  return {
    name: booking.name || "",
    contact: booking.contact || "",
    date: booking.date || "",
    guests: booking.guests || "",
    event_title: booking.event_title || "",
    status: booking.status,
  };
}

function toPayload(form: FormState): BookingWrite {
  return {
    name: form.name,
    contact: form.contact,
    date: form.date,
    guests: form.guests,
    event_title: form.event_title,
    status: form.status,
  };
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{error}</p> : null}
    </label>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = Number(params.id);
  const invalidId = !Number.isInteger(bookingId) || bookingId <= 0;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [createdAt, setCreatedAt] = useState("");
  const [error, setError] = useState(invalidId ? "Бронь не найдена." : "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!invalidId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getBooking(bookingId)
      .then((booking) => {
        if (cancelled) return;
        setForm(fromBooking(booking));
        setCreatedAt(booking.created_at);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, invalidId]);

  function mapErrors(err: unknown) {
    if (err instanceof AdminApiError && err.status === 400) {
      const mapped = adminFieldErrors(err.body);
      setFieldErrors(mapped);
      setError(mapped.detail || mapped.non_field_errors || err.message);
      return;
    }
    setFieldErrors({});
    setError(err instanceof AdminApiError ? err.message : "Не удалось сохранить.");
  }

  function applySaved(booking: AdminBooking) {
    setForm(fromBooking(booking));
    setCreatedAt(booking.created_at);
    setFieldErrors({});
    setError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (invalidId) return;
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const saved = await patchBooking(bookingId, toPayload(form));
      applySaved(saved);
    } catch (err) {
      mapErrors(err);
    } finally {
      setSaving(false);
    }
  }

  async function onStatus(status: BookingStatus) {
    if (invalidId) return;
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const saved = await patchBooking(bookingId, { status });
      applySaved(saved);
    } catch (err) {
      mapErrors(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/45">Загрузка…</p>;
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6">
        <Link href="/admin/bookings" className="text-sm text-white/40 hover:text-[hsl(187,83%,26%)]">
          ← Брони
        </Link>
        <h1 className="mt-2 font-serif text-[26px] font-medium">{form.name || "Бронь"}</h1>
      </div>

      {error ? (
        <p
          className="mb-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Имя" error={fieldErrors.name}>
            <input
              required
              value={form.name}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={INPUT}
            />
          </Field>
          <Field label="Контакт" error={fieldErrors.contact}>
            <input
              required
              value={form.contact}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Дата" error={fieldErrors.date}>
            <DateTimeField
              value={form.date}
              disabled={saving}
              locale="ru-RU"
              onChange={(eventDate) => setForm((current) => ({ ...current, date: eventDate }))}
            />
          </Field>
          <Field label="Гостей" error={fieldErrors.guests}>
            <input
              required
              value={form.guests}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, guests: event.target.value }))}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Событие" error={fieldErrors.event_title}>
            <input
              value={form.event_title}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, event_title: event.target.value }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="Статус" error={fieldErrors.status}>
            <select
              value={form.status}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as BookingStatus }))
              }
              className={INPUT}
            >
              <option value="pending">{STATUS_LABEL.pending}</option>
              <option value="confirmed">{STATUS_LABEL.confirmed}</option>
              <option value="rejected">{STATUS_LABEL.rejected}</option>
            </select>
          </Field>
        </div>

        {createdAt ? (
          <div>
            <span className={LABEL}>Создано</span>
            <p className="text-sm text-white/70">{formatCreatedAt(createdAt)}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving || form.status === "confirmed"}
            onClick={() => void onStatus("confirmed")}
            className={BTN}
          >
            Подтвердить
          </button>
          <button
            type="button"
            disabled={saving || form.status === "rejected"}
            onClick={() => void onStatus("rejected")}
            className={BTN_REJECT}
          >
            Отклонить
          </button>
          <button type="submit" disabled={saving} className={BTN_GHOST}>
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
