"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminTable, { type AdminColumn } from "@/components/admin/AdminTable";
import { AdminApiError, adminFieldErrors } from "@/lib/admin-api";

const INPUT =
  "w-full rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50";
const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40";

export type TaxonomyRow = {
  id: number;
  name_ru: string;
  name_en: string;
  description_ru?: string;
  description_en?: string;
};

type FormState = {
  name_ru: string;
  name_en: string;
  description_ru: string;
  description_en: string;
};

const EMPTY: FormState = {
  name_ru: "",
  name_en: "",
  description_ru: "",
  description_en: "",
};

function fromRow(row: TaxonomyRow): FormState {
  return {
    name_ru: row.name_ru || "",
    name_en: row.name_en || "",
    description_ru: row.description_ru || "",
    description_en: row.description_en || "",
  };
}

export default function TaxonomyEditor({
  title,
  withDescriptions = false,
  load,
  create,
  patch,
  remove,
}: {
  title: string;
  withDescriptions?: boolean;
  load: () => Promise<TaxonomyRow[]>;
  create: (body: FormState) => Promise<TaxonomyRow>;
  patch: (id: number, body: FormState) => Promise<TaxonomyRow>;
  remove: (id: number) => Promise<unknown>;
}) {
  const [rows, setRows] = useState<TaxonomyRow[] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const data = await load();
    setRows(data);
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function selectRow(row: TaxonomyRow) {
    setEditingId(row.id);
    setForm(fromRow(row));
    setError("");
    setFieldErrors({});
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
  }

  function mapSaveErrors(err: unknown) {
    if (err instanceof AdminApiError && err.status === 400) {
      const mapped = adminFieldErrors(err.body);
      if (mapped.name && !mapped.name_ru) mapped.name_ru = mapped.name;
      setFieldErrors(mapped);
      const joined = [...new Set(Object.values(mapped))].filter(Boolean).join(" ");
      setError(joined || err.message);
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
    const body = withDescriptions
      ? form
      : { name_ru: form.name_ru, name_en: form.name_en, description_ru: "", description_en: "" };
    try {
      if (editingId === null) {
        await create(body);
        resetForm();
      } else {
        await patch(editingId, body);
      }
      await refresh();
    } catch (err) {
      mapSaveErrors(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: TaxonomyRow) {
    setError("");
    try {
      await remove(row.id);
      if (editingId === row.id) resetForm();
      await refresh();
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 409) {
        setError(err.message);
        return;
      }
      setError(err instanceof AdminApiError ? err.message : "Не удалось удалить.");
    }
  }

  const columns: AdminColumn<TaxonomyRow>[] = [
    { key: "name_ru", header: "Название (ru)", render: (row) => row.name_ru || "—" },
    { key: "name_en", header: "Название (en)", render: (row) => row.name_en || "—" },
    {
      key: "delete",
      header: "",
      className: "w-28 text-right",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void onDelete(row);
          }}
          className="text-sm text-[hsl(357,100%,55%)] transition-colors hover:text-[hsl(357,100%,65%)]"
        >
          Удалить
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-serif text-[26px] font-medium">{title}</h1>

      {error ? (
        <p
          className="mb-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mb-6 rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] px-5 py-4"
      >
        <p className="mb-4 text-sm text-white/45">
          {editingId === null ? "Новая запись" : "Редактирование"}
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Название (ru)</span>
            <input
              required
              value={form.name_ru}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, name_ru: event.target.value }))}
              className={INPUT}
            />
            {fieldErrors.name_ru ? (
              <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.name_ru}</p>
            ) : null}
          </label>
          <label className="block">
            <span className={LABEL}>Название (en)</span>
            <input
              value={form.name_en}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))}
              className={INPUT}
            />
            {fieldErrors.name_en ? (
              <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.name_en}</p>
            ) : null}
          </label>
          {fieldErrors.slug ? (
            <p className="text-xs text-[hsl(357,100%,55%)] md:col-span-2">{fieldErrors.slug}</p>
          ) : null}
          {withDescriptions ? (
            <>
              <label className="block">
                <span className={LABEL}>Описание (ru)</span>
                <textarea
                  rows={3}
                  value={form.description_ru}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description_ru: event.target.value }))
                  }
                  className={`${INPUT} resize-y`}
                />
                {fieldErrors.description_ru ? (
                  <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.description_ru}</p>
                ) : null}
              </label>
              <label className="block">
                <span className={LABEL}>Описание (en)</span>
                <textarea
                  rows={3}
                  value={form.description_en}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description_en: event.target.value }))
                  }
                  className={`${INPUT} resize-y`}
                />
                {fieldErrors.description_en ? (
                  <p className="mt-1 text-xs text-[hsl(357,100%,55%)]">{fieldErrors.description_en}</p>
                ) : null}
              </label>
            </>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60"
          >
            Сохранить
          </button>
          {editingId !== null ? (
            <button
              type="button"
              disabled={saving}
              onClick={resetForm}
              className="rounded-md border border-white/[0.08] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] disabled:opacity-60"
            >
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      {rows === null && !error ? <p className="text-sm text-white/45">Загрузка…</p> : null}
      {rows ? (
        <AdminTable
          rows={rows}
          columns={columns}
          getRowKey={(row) => row.id}
          onRowClick={selectRow}
        />
      ) : null}
    </div>
  );
}
