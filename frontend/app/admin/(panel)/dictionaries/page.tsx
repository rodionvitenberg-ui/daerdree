"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AdminApiError,
  getTranslations,
  putTranslations,
  type TranslationGroup,
} from "@/lib/admin-api";

type EditorKey = { key: string; ru: string; en: string };
type EditorGroup = { name: string; keys: EditorKey[] };

function leafToText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

// FAQ leaves are arrays/objects; parse JSON if the textarea looks like a collection.
function textToLeaf(text: string): unknown {
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function displayKey(key: string): string {
  const dot = key.indexOf(".");
  return dot === -1 ? key : key.slice(dot + 1);
}

function toEditor(groups: TranslationGroup[]): EditorGroup[] {
  return groups.map((group) => ({
    name: group.name,
    keys: group.keys.map((item) => ({
      key: item.key,
      ru: leafToText(item.ru),
      en: leafToText(item.en),
    })),
  }));
}

function snapshot(groups: EditorGroup[]): Record<string, { ru: unknown; en: unknown }> {
  const keys: Record<string, { ru: unknown; en: unknown }> = {};
  for (const group of groups) {
    for (const item of group.keys) {
      keys[item.key] = { ru: textToLeaf(item.ru), en: textToLeaf(item.en) };
    }
  }
  return keys;
}

function textareaRows(value: string): number {
  return Math.min(20, Math.max(2, value.split("\n").length));
}

function GroupSection({
  group,
  defaultOpen,
  saving,
  onPatch,
}: {
  group: EditorGroup;
  defaultOpen: boolean;
  saving: boolean;
  onPatch: (fullKey: string, lang: "ru" | "en", value: string) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useLayoutEffect(() => {
    if (defaultOpen && ref.current) ref.current.open = true;
  }, [defaultOpen]);
  return (
    <details
      ref={ref}
      className="mb-3 overflow-hidden rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)]"
    >
      <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-semibold">
        {group.name}
      </summary>
      <div className="border-t border-white/[0.08]">
        <div className="hidden grid-cols-[minmax(7rem,18%)_1fr_1fr] gap-3 px-4 py-2.5 md:grid">
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Ключ
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Русский (ru)
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Английский (en)
          </span>
        </div>
        {group.keys.map((item) => {
          const display = displayKey(item.key);
          return (
            <div
              key={item.key}
              className="grid grid-cols-1 gap-3 border-t border-white/[0.04] px-4 py-3 md:grid-cols-[minmax(7rem,18%)_1fr_1fr]"
            >
              <div className="break-all pt-1 text-xs text-white/45">{display}</div>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 md:sr-only">
                  Русский (ru)
                </span>
                <textarea
                  aria-label={`${display} ru`}
                  value={item.ru}
                  rows={textareaRows(item.ru)}
                  disabled={saving}
                  onChange={(event) => onPatch(item.key, "ru", event.target.value)}
                  className="w-full resize-y rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40 md:sr-only">
                  Английский (en)
                </span>
                <textarea
                  aria-label={`${display} en`}
                  value={item.en}
                  rows={textareaRows(item.en)}
                  disabled={saving}
                  onChange={(event) => onPatch(item.key, "en", event.target.value)}
                  className="w-full resize-y rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
                />
              </label>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default function DictionariesPage() {
  const [groups, setGroups] = useState<EditorGroup[] | null>(null);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTranslations()
      .then((data) => {
        if (!cancelled) {
          setGroups(toEditor(data.groups));
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
  }, []);

  useEffect(() => {
    if (savedAt === null) return;
    const id = window.setTimeout(() => setSavedAt(null), 3000);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  function patchKey(fullKey: string, lang: "ru" | "en", value: string) {
    setGroups((current) => {
      if (!current) return current;
      return current.map((group) => ({
        ...group,
        keys: group.keys.map((item) =>
          item.key === fullKey ? { ...item, [lang]: value } : item,
        ),
      }));
    });
  }

  async function onSave() {
    if (!groups) return;
    setError("");
    setSaving(true);
    try {
      await putTranslations(snapshot(groups));
      setSavedAt(Date.now());
    } catch (err) {
      setSavedAt(null);
      setError(err instanceof AdminApiError ? err.message : "Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[26px] font-medium">Словари</h1>
        <button
          type="button"
          onClick={onSave}
          disabled={!groups || saving}
          className="rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60"
        >
          Сохранить
        </button>
      </div>

      {savedAt !== null ? (
        <p className="mb-4 rounded-[10px] border border-[hsl(187,83%,26%)]/40 bg-[hsl(187,83%,26%)]/10 px-4 py-2.5 text-sm">
          Сохранено
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]" role="alert">
          {error}
        </p>
      ) : null}

      {groups === null && !error ? (
        <p className="text-sm text-white/45">Загрузка…</p>
      ) : null}

      {groups && groups.length === 0 ? (
        <p className="rounded-[10px] border border-white/[0.08] bg-[hsl(56,100%,3%)] px-5 py-8 text-center text-sm text-white/45">
          Нет ключей.
        </p>
      ) : null}

      {groups?.map((group, index) => (
        <GroupSection
          key={group.name}
          group={group}
          defaultOpen={index === 0}
          saving={saving}
          onPatch={patchKey}
        />
      ))}
    </div>
  );
}
