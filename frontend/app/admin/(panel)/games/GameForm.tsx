"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminApiError,
  adminFieldErrors,
  createGame,
  deleteGame,
  deleteGameCover,
  deleteGameGallery,
  deleteGameSetupImage,
  getGame,
  listCategories,
  listTags,
  patchGame,
  patchGameGallery,
  uploadGameCover,
  uploadGameGallery,
  uploadGameSetupImage,
  type AdminCategory,
  type AdminGame,
  type AdminGameImage,
  type AdminGameImageType,
  type AdminTag,
  type GameWrite,
} from "@/lib/admin-api";

const INPUT =
  "w-full rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40";
const BTN =
  "rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60";
const BTN_GHOST =
  "rounded-md border border-white/[0.08] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] disabled:opacity-60";

const DIFFICULTY = [
  { value: 1, label: "Очень легко" },
  { value: 2, label: "Легко" },
  { value: 3, label: "Средне" },
  { value: 4, label: "Сложно" },
  { value: 5, label: "Хардкор" },
];

const IMAGE_TYPES: { value: AdminGameImageType; label: string }[] = [
  { value: "cover", label: "Обложка" },
  { value: "background", label: "Фон" },
  { value: "gallery", label: "Галерея" },
];

type ExpansionDraft = {
  key: string;
  id?: number;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
};

type PendingGallery = {
  key: string;
  file: File;
  image_type: AdminGameImageType;
  order: number;
  alt: string;
};

type FormState = {
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: number;
  designer: string;
  bgg_type: string;
  is_active: boolean;
  is_visible_ru: boolean;
  is_visible_en: boolean;
  categories: number[];
  tags: number[];
  expansions: ExpansionDraft[];
};

const EMPTY: FormState = {
  title_ru: "",
  title_en: "",
  description_ru: "",
  description_en: "",
  min_players: 2,
  max_players: 4,
  play_time: 45,
  difficulty: 2,
  designer: "",
  bgg_type: "boardgame",
  is_active: true,
  is_visible_ru: true,
  is_visible_en: false,
  categories: [],
  tags: [],
  expansions: [],
};

function newExpansion(): ExpansionDraft {
  return {
    key: crypto.randomUUID(),
    title_ru: "",
    title_en: "",
    description_ru: "",
    description_en: "",
  };
}

function fromGame(game: AdminGame): FormState {
  return {
    title_ru: game.title_ru || "",
    title_en: game.title_en || "",
    description_ru: game.description_ru || "",
    description_en: game.description_en || "",
    min_players: game.min_players ?? 2,
    max_players: game.max_players ?? 4,
    play_time: game.play_time ?? 45,
    difficulty: game.difficulty ?? 2,
    designer: game.designer || "",
    bgg_type: game.bgg_type || "",
    is_active: Boolean(game.is_active),
    is_visible_ru: Boolean(game.is_visible_ru),
    is_visible_en: Boolean(game.is_visible_en),
    categories: (game.categories || []).map((item) => item.id),
    tags: (game.tags || []).map((item) => item.id),
    expansions: (game.expansions || []).map((item) => ({
      key: String(item.id ?? crypto.randomUUID()),
      id: item.id,
      title_ru: item.title_ru || "",
      title_en: item.title_en || "",
      description_ru: item.description_ru || "",
      description_en: item.description_en || "",
    })),
  };
}

function toPayload(form: FormState): GameWrite {
  return {
    title_ru: form.title_ru,
    title_en: form.title_en,
    description_ru: form.description_ru,
    description_en: form.description_en,
    min_players: Number(form.min_players),
    max_players: Number(form.max_players),
    play_time: Number(form.play_time),
    difficulty: Number(form.difficulty),
    designer: form.designer,
    bgg_type: form.bgg_type,
    is_active: form.is_active,
    is_visible_ru: form.is_visible_ru,
    is_visible_en: form.is_visible_en,
    categories: form.categories,
    tags: form.tags,
    expansions: form.expansions.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      title_ru: item.title_ru,
      title_en: item.title_en,
      description_ru: item.description_ru,
      description_en: item.description_en,
    })),
  };
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

function Preview({ html }: { html: string }) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2">
      {html ? (
        <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="text-sm text-white/35">—</p>
      )}
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  disabled,
  onToggle,
}: {
  options: { id: number; name_ru: string; name_en: string }[];
  selected: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-white/45">Пусто</p>;
  }
  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2">
      {options.map((option) => (
        <label key={option.id} className="flex items-center gap-2 py-1 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            disabled={disabled}
            onChange={() => onToggle(option.id)}
            className="accent-[hsl(187,83%,26%)]"
          />
          {option.name_ru || option.name_en || option.id}
        </label>
      ))}
    </div>
  );
}

function GalleryRow({
  gameId,
  item,
  disabled,
  onUpdated,
  onDeleted,
}: {
  gameId: number;
  item: AdminGameImage;
  disabled: boolean;
  onUpdated: (item: AdminGameImage) => void;
  onDeleted: (id: number) => void;
}) {
  const [order, setOrder] = useState(item.order);
  const [alt, setAlt] = useState(item.alt);
  const [error, setError] = useState("");

  async function persist(next: Partial<Pick<AdminGameImage, "image_type" | "order" | "alt">>) {
    setError("");
    try {
      onUpdated(await patchGameGallery(gameId, item.id, next));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось сохранить.");
    }
  }

  async function remove() {
    setError("");
    try {
      await deleteGameGallery(gameId, item.id);
      onDeleted(item.id);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось удалить.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 border-t border-white/[0.06] py-3 md:grid-cols-[6rem_1fr_6rem_1fr_auto] md:items-end">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.alt || ""} className="h-16 w-24 rounded object-cover" />
      ) : (
        <div className="h-16 w-24 rounded bg-white/5" />
      )}
      <label className="block">
        <span className={LABEL}>Тип</span>
        <select
          value={item.image_type}
          disabled={disabled}
          onChange={(event) => {
            void persist({ image_type: event.target.value as AdminGameImageType });
          }}
          className={INPUT}
        >
          {IMAGE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={LABEL}>Порядок</span>
        <input
          type="number"
          min={0}
          value={order}
          disabled={disabled}
          onChange={(event) => setOrder(Number(event.target.value))}
          onBlur={() => {
            if (order !== item.order) void persist({ order });
          }}
          className={INPUT}
        />
      </label>
      <label className="block">
        <span className={LABEL}>Alt</span>
        <input
          value={alt}
          disabled={disabled}
          onChange={(event) => setAlt(event.target.value)}
          onBlur={() => {
            if (alt !== item.alt) void persist({ alt });
          }}
          className={INPUT}
        />
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void remove()}
        className="text-sm text-[hsl(357,100%,55%)]"
      >
        Удалить
      </button>
      {error ? (
        <p className="text-xs text-[hsl(357,100%,55%)] md:col-span-5" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof AdminApiError) {
    const mapped = adminFieldErrors(err.body);
    return mapped.detail || mapped.non_field_errors || mapped.file || err.message;
  }
  return err instanceof Error ? err.message : "Не удалось загрузить.";
}

export default function GameForm({ gameId, imageError }: { gameId?: number; imageError?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [setupImage, setSetupImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<AdminGameImage[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [setupFile, setSetupFile] = useState<File | null>(null);
  const [coverDelete, setCoverDelete] = useState(false);
  const [setupDelete, setSetupDelete] = useState(false);
  const [pendingGallery, setPendingGallery] = useState<PendingGallery[]>([]);
  const [galleryType, setGalleryType] = useState<AdminGameImageType>("gallery");
  const [galleryOrder, setGalleryOrder] = useState(0);
  const [galleryAlt, setGalleryAlt] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);
  const setupPreview = useMemo(() => (setupFile ? URL.createObjectURL(setupFile) : null), [setupFile]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    return () => {
      if (setupPreview) URL.revokeObjectURL(setupPreview);
    };
  }, [setupPreview]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catList, tagList] = await Promise.all([listCategories(), listTags()]);
        if (cancelled) return;
        setCategories(catList);
        setTags(tagList);
        if (gameId) {
          const game = await getGame(gameId);
          if (cancelled) return;
          setForm(fromGame(game));
          setImage(game.image);
          setSetupImage(game.setup_image);
          setGallery(game.images || []);
        }
        if (imageError) {
          const detail = imageError === "1" ? "ошибка загрузки" : imageError;
          setError(`Игра сохранена, но картинки не загрузились: ${detail}`);
        } else {
          setError("");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, imageError]);

  function toggleId(key: "categories" | "tags", id: number) {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  }

  function patchExpansion(key: string, patch: Partial<ExpansionDraft>) {
    setForm((current) => ({
      ...current,
      expansions: current.expansions.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));
  }

  async function uploadPending(id: number) {
    if (coverFile) await uploadGameCover(id, coverFile);
    else if (coverDelete) await deleteGameCover(id);
    if (setupFile) await uploadGameSetupImage(id, setupFile);
    else if (setupDelete) await deleteGameSetupImage(id);
    for (const item of pendingGallery) {
      await uploadGameGallery(id, item.file, {
        image_type: item.image_type,
        order: item.order,
        alt: item.alt,
      });
    }
  }

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
    setSaving(true);
    try {
      if (gameId) {
        await patchGame(gameId, toPayload(form));
        await uploadPending(gameId);
        const fresh = await getGame(gameId);
        setForm(fromGame(fresh));
        setImage(fresh.image);
        setSetupImage(fresh.setup_image);
        setGallery(fresh.images || []);
        setCoverFile(null);
        setSetupFile(null);
        setCoverDelete(false);
        setSetupDelete(false);
        setPendingGallery([]);
      } else {
        const created = await createGame(toPayload(form));
        try {
          await uploadPending(created.id);
          router.push(`/admin/games/${created.id}`);
        } catch (uploadErr) {
          const params = new URLSearchParams({ imageError: uploadErrorMessage(uploadErr) });
          router.push(`/admin/games/${created.id}?${params.toString()}`);
        }
      }
    } catch (err) {
      mapErrors(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!gameId) return;
    if (!window.confirm("Удалить игру?")) return;
    setSaving(true);
    try {
      await deleteGame(gameId);
      const query = typeof window !== "undefined" ? window.location.search : "";
      router.push(`/admin/games${query}`);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось удалить.");
      setSaving(false);
    }
  }

  async function addGallery() {
    if (!galleryFile) return;
    if (!gameId) {
      setPendingGallery((current) => [
        ...current,
        {
          key: crypto.randomUUID(),
          file: galleryFile,
          image_type: galleryType,
          order: galleryOrder,
          alt: galleryAlt,
        },
      ]);
      setGalleryFile(null);
      setGalleryAlt("");
      setGalleryInputKey((key) => key + 1);
      return;
    }
    setSaving(true);
    try {
      const created = await uploadGameGallery(gameId, galleryFile, {
        image_type: galleryType,
        order: galleryOrder,
        alt: galleryAlt,
      });
      setGallery((current) => [...current, created]);
      setGalleryFile(null);
      setGalleryAlt("");
      setGalleryInputKey((key) => key + 1);
      setError("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/45">Загрузка…</p>;
  }

  const coverSrc = coverPreview || (coverDelete ? null : image);
  const setupSrc = setupPreview || (setupDelete ? null : setupImage);

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-serif text-[26px] font-medium">
        {gameId ? form.title_ru || "Игра" : "Новая игра"}
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
          <Field label="Название (ru)" error={fieldErrors.title_ru}>
            <input
              required
              value={form.title_ru}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, title_ru: event.target.value }))}
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
          <div>
            <Field label="Описание (ru)" error={fieldErrors.description_ru}>
              <textarea
                rows={8}
                value={form.description_ru}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description_ru: event.target.value }))
                }
                className={`${INPUT} resize-y font-mono text-xs`}
              />
            </Field>
            <p className={`${LABEL} mt-3`}>Предпросмотр (ru)</p>
            <Preview html={form.description_ru} />
          </div>
          <div>
            <Field label="Описание (en)" error={fieldErrors.description_en}>
              <textarea
                rows={8}
                value={form.description_en}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description_en: event.target.value }))
                }
                className={`${INPUT} resize-y font-mono text-xs`}
              />
            </Field>
            <p className={`${LABEL} mt-3`}>Предпросмотр (en)</p>
            <Preview html={form.description_en} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Мин. игроков" error={fieldErrors.min_players}>
            <input
              type="number"
              min={1}
              value={form.min_players}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, min_players: Number(event.target.value) }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="Макс. игроков" error={fieldErrors.max_players}>
            <input
              type="number"
              min={1}
              value={form.max_players}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, max_players: Number(event.target.value) }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="Время (мин)" error={fieldErrors.play_time}>
            <input
              type="number"
              min={1}
              value={form.play_time}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, play_time: Number(event.target.value) }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="Сложность" error={fieldErrors.difficulty}>
            <select
              value={form.difficulty}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, difficulty: Number(event.target.value) }))
              }
              className={INPUT}
            >
              {DIFFICULTY.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Дизайнер" error={fieldErrors.designer}>
            <input
              value={form.designer}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, designer: event.target.value }))}
              className={INPUT}
            />
          </Field>
          <Field label="Тип BGG" error={fieldErrors.bgg_type}>
            <input
              value={form.bgg_type}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, bgg_type: event.target.value }))}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              className="accent-[hsl(187,83%,26%)]"
            />
            Активна
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible_ru}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_visible_ru: event.target.checked }))
              }
              className="accent-[hsl(187,83%,26%)]"
            />
            Показывать на русском
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible_en}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_visible_en: event.target.checked }))
              }
              className="accent-[hsl(187,83%,26%)]"
            />
            Показывать на английском
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <span className={LABEL}>Категории</span>
            <MultiSelect
              options={categories}
              selected={form.categories}
              disabled={saving}
              onToggle={(id) => toggleId("categories", id)}
            />
            {fieldErrors.categories ? (
              <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.categories}</p>
            ) : null}
          </div>
          <div>
            <span className={LABEL}>Теги</span>
            <MultiSelect
              options={tags}
              selected={form.tags}
              disabled={saving}
              onToggle={(id) => toggleId("tags", id)}
            />
            {fieldErrors.tags ? (
              <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.tags}</p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className={`${LABEL} mb-0`}>Дополнения</span>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setForm((current) => ({ ...current, expansions: [...current.expansions, newExpansion()] }))
              }
              className={BTN_GHOST}
            >
              Добавить дополнение
            </button>
          </div>
          {fieldErrors.expansions ? (
            <p className="mb-2 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.expansions}</p>
          ) : null}
          {form.expansions.length === 0 ? <p className="text-sm text-white/45">Пусто</p> : null}
          <div className="space-y-3">
            {form.expansions.map((item) => (
              <div key={item.key} className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Название (ru)">
                    <input
                      value={item.title_ru}
                      disabled={saving}
                      onChange={(event) => patchExpansion(item.key, { title_ru: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Название (en)">
                    <input
                      value={item.title_en}
                      disabled={saving}
                      onChange={(event) => patchExpansion(item.key, { title_en: event.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Описание (ru)">
                    <textarea
                      rows={3}
                      value={item.description_ru}
                      disabled={saving}
                      onChange={(event) => patchExpansion(item.key, { description_ru: event.target.value })}
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                  <Field label="Описание (en)">
                    <textarea
                      rows={3}
                      value={item.description_en}
                      disabled={saving}
                      onChange={(event) => patchExpansion(item.key, { description_en: event.target.value })}
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      expansions: current.expansions.filter((row) => row.key !== item.key),
                    }))
                  }
                  className="mt-3 text-sm text-[hsl(357,100%,55%)]"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] p-4">
          <p className={LABEL}>Обложка и расклад</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className={LABEL}>Обложка</span>
              {coverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverSrc} alt="" className="mb-2 h-32 rounded object-contain" />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(event) => {
                  setCoverFile(event.target.files?.[0] ?? null);
                  setCoverDelete(false);
                }}
                className="block text-sm"
              />
              {coverSrc ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setCoverFile(null);
                    setCoverDelete(true);
                  }}
                  className="mt-2 text-sm text-[hsl(357,100%,55%)]"
                >
                  Удалить
                </button>
              ) : null}
            </div>
            <div>
              <span className={LABEL}>Расклад</span>
              {setupSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={setupSrc} alt="" className="mb-2 h-32 rounded object-contain" />
              ) : null}
              <input
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(event) => {
                  setSetupFile(event.target.files?.[0] ?? null);
                  setSetupDelete(false);
                }}
                className="block text-sm"
              />
              {setupSrc ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSetupFile(null);
                    setSetupDelete(true);
                  }}
                  className="mt-2 text-sm text-[hsl(357,100%,55%)]"
                >
                  Удалить
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] p-4">
          <p className={LABEL}>Галерея</p>
          {gallery.map((item) => (
            <GalleryRow
              key={item.id}
              gameId={gameId || 0}
              item={item}
              disabled={saving || !gameId}
              onUpdated={(updated) =>
                setGallery((current) => current.map((row) => (row.id === updated.id ? updated : row)))
              }
              onDeleted={(id) => setGallery((current) => current.filter((row) => row.id !== id))}
            />
          ))}
          {pendingGallery.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-1 gap-3 border-t border-white/[0.06] py-3 md:grid-cols-[6rem_1fr_6rem_1fr_auto] md:items-end"
            >
              <p className="truncate text-xs text-white/45">{item.file.name}</p>
              <label className="block">
                <span className={LABEL}>Тип</span>
                <select
                  value={item.image_type}
                  disabled={saving}
                  onChange={(event) => {
                    const value = event.target.value as AdminGameImageType;
                    setPendingGallery((current) =>
                      current.map((row) => (row.key === item.key ? { ...row, image_type: value } : row)),
                    );
                  }}
                  className={INPUT}
                >
                  {IMAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={LABEL}>Порядок</span>
                <input
                  type="number"
                  min={0}
                  value={item.order}
                  disabled={saving}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPendingGallery((current) =>
                      current.map((row) => (row.key === item.key ? { ...row, order: value } : row)),
                    );
                  }}
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Alt</span>
                <input
                  value={item.alt}
                  disabled={saving}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPendingGallery((current) =>
                      current.map((row) => (row.key === item.key ? { ...row, alt: value } : row)),
                    );
                  }}
                  className={INPUT}
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setPendingGallery((current) => current.filter((row) => row.key !== item.key))
                }
                className="text-sm text-[hsl(357,100%,55%)]"
              >
                Удалить
              </button>
            </div>
          ))}
          {gallery.length === 0 && pendingGallery.length === 0 ? (
            <p className="mb-3 text-sm text-white/45">Пусто</p>
          ) : null}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_8rem_6rem_1fr_auto] md:items-end">
            <label className="block">
              <span className={LABEL}>Файл</span>
              <input
                key={galleryInputKey}
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
            </label>
            <label className="block">
              <span className={LABEL}>Тип</span>
              <select
                value={galleryType}
                disabled={saving}
                onChange={(event) => setGalleryType(event.target.value as AdminGameImageType)}
                className={INPUT}
              >
                {IMAGE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Порядок</span>
              <input
                type="number"
                min={0}
                value={galleryOrder}
                disabled={saving}
                onChange={(event) => setGalleryOrder(Number(event.target.value))}
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Alt</span>
              <input
                value={galleryAlt}
                disabled={saving}
                onChange={(event) => setGalleryAlt(event.target.value)}
                className={INPUT}
              />
            </label>
            <button type="button" disabled={saving || !galleryFile} onClick={() => void addGallery()} className={BTN}>
              Загрузить
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={BTN}>
            Сохранить
          </button>
          {gameId ? (
            <button type="button" disabled={saving} onClick={() => void onDelete()} className={BTN_GHOST}>
              Удалить игру
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
