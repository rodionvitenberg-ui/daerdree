"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminApiError,
  adminFieldErrors,
  createEvent,
  deleteEvent,
  getEvent,
  patchEvent,
  type AdminEvent,
  type EventWrite,
} from "@/lib/admin-api";

const INPUT =
  "w-full rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40";
const BTN =
  "rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60";
const BTN_GHOST =
  "rounded-md border border-white/[0.08] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] disabled:opacity-60";

type FormState = {
  title: string;
  description: string;
  title_en: string;
  description_en: string;
  event_date: string;
  is_visible: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

function nowLocal(): string {
  return toDatetimeLocal(new Date().toISOString());
}

function emptyForm(): FormState {
  return {
    title: "",
    description: "",
    title_en: "",
    description_en: "",
    event_date: nowLocal(),
    is_visible: true,
  };
}

function fromEvent(event: AdminEvent): FormState {
  return {
    title: event.title || "",
    description: event.description || "",
    title_en: event.title_en || "",
    description_en: event.description_en || "",
    event_date: toDatetimeLocal(event.event_date),
    is_visible: Boolean(event.is_visible),
  };
}

function toPayload(form: FormState): EventWrite {
  return {
    title: form.title,
    description: form.description,
    title_en: form.title_en,
    description_en: form.description_en,
    event_date: fromDatetimeLocal(form.event_date),
    is_visible: form.is_visible,
  };
}

function toFormData(form: FormState, image: File | null): FormData {
  const body = new FormData();
  const payload = toPayload(form);
  body.append("title", payload.title);
  body.append("description", payload.description);
  body.append("title_en", payload.title_en);
  body.append("description_en", payload.description_en);
  body.append("event_date", payload.event_date);
  body.append("is_visible", payload.is_visible ? "true" : "false");
  if (image) body.append("image", image);
  return body;
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

export default function EventForm({ eventId }: { eventId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    getEvent(eventId)
      .then((event) => {
        if (cancelled) return;
        setForm(fromEvent(event));
        setImageUrl(event.image);
        setTelegramId(event.telegram_id);
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
  }, [eventId]);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    if (!eventId && !imageFile) {
      setFieldErrors({ image: "Добавьте афишу." });
      setError("Добавьте афишу.");
      return;
    }
    setSaving(true);
    try {
      if (eventId) {
        const saved = imageFile
          ? await patchEvent(eventId, toFormData(form, imageFile))
          : await patchEvent(eventId, toPayload(form));
        setForm(fromEvent(saved));
        setImageUrl(saved.image);
        setTelegramId(saved.telegram_id);
        setImageFile(null);
      } else {
        const created = await createEvent(toFormData(form, imageFile));
        router.push(`/admin/events/${created.id}`);
      }
    } catch (err) {
      mapErrors(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!eventId) return;
    if (!window.confirm("Удалить событие?")) return;
    setSaving(true);
    try {
      await deleteEvent(eventId);
      router.push("/admin/events");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось удалить.");
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/45">Загрузка…</p>;
  }

  const posterSrc = imagePreview || imageUrl;

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-serif text-[26px] font-medium">
        {eventId ? form.title || "Событие" : "Новое событие"}
      </h1>

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
          <Field label="Название (ru)" error={fieldErrors.title}>
            <input
              required
              value={form.title}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className={INPUT}
            />
          </Field>
          <Field label="Название (en)" error={fieldErrors.title_en}>
            <input
              value={form.title_en}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, title_en: event.target.value }))}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Описание (ru)" error={fieldErrors.description}>
            <textarea
              required
              rows={8}
              value={form.description}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className={`${INPUT} resize-y`}
            />
          </Field>
          <Field label="Описание (en)" error={fieldErrors.description_en}>
            <textarea
              rows={8}
              value={form.description_en}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, description_en: event.target.value }))
              }
              className={`${INPUT} resize-y`}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Дата и время" error={fieldErrors.event_date}>
            <input
              required
              type="datetime-local"
              value={form.event_date}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, event_date: event.target.value }))
              }
              className={INPUT}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_visible: event.target.checked }))
              }
              className="accent-[hsl(187,83%,26%)]"
            />
            Показывать на сайте
          </label>
        </div>

        {telegramId ? (
          <div>
            <span className={LABEL}>Telegram ID</span>
            <p className="text-sm text-white/70">{telegramId}</p>
          </div>
        ) : null}

        <div className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] p-4">
          <Field label="Афиша" error={fieldErrors.image}>
            {posterSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterSrc} alt="" className="mb-2 h-40 rounded object-contain" />
            ) : null}
            <input
              type="file"
              accept="image/*"
              required={!eventId}
              disabled={saving}
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              className="block text-sm"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={BTN}>
            Сохранить
          </button>
          {eventId ? (
            <button type="button" disabled={saving} onClick={() => void onDelete()} className={BTN_GHOST}>
              Удалить событие
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
