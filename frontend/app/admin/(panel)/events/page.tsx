"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTable, { type AdminColumn } from "@/components/admin/AdminTable";
import {
  AdminApiError,
  adminNextPath,
  listEvents,
  type AdminEvent,
} from "@/lib/admin-api";

const INPUT =
  "w-full max-w-sm rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)]";

function flag(value: boolean) {
  return value ? "да" : "нет";
}

function formatDate(iso: string) {
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

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(query.trim());
  const [filterVisible, setFilterVisible] = useState(searchParams.get("is_visible") ?? "");
  const [items, setItems] = useState<AdminEvent[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(query.trim());
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("search", query.trim());
      else params.delete("search");
      router.replace(`/admin/events?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/admin/events?${params.toString()}`, { scroll: false });
    setFilterVisible(value);
    setItems(null);
    setNext(null);
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterVisible) params.set("is_visible", filterVisible);
    listEvents(search, params.toString() ? `/api/admin/events/?${params.toString()}` : undefined)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results ?? []);
        setNext(adminNextPath(data.next));
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
      });
    return () => {
      cancelled = true;
    };
  }, [search, filterVisible]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const data = await listEvents(search, next);
      setItems((current) => [...(current ?? []), ...(data.results ?? [])]);
      setNext(adminNextPath(data.next));
      setError("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
    } finally {
      setLoadingMore(false);
    }
  }

  const columns: AdminColumn<AdminEvent>[] = [
    { key: "title", header: "Название", render: (row) => row.title || "—" },
    { key: "event_date", header: "Дата", render: (row) => formatDate(row.event_date) },
    { key: "is_visible", header: "Видимо", render: (row) => flag(row.is_visible) },
    {
      key: "edit",
      header: "",
      className: "w-28 text-right",
      render: (row) => (
        <Link href={`/admin/events/${row.id}`} className="admin-accent text-sm font-semibold">
          Изменить
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[26px] font-medium">События</h1>
        <Link
          href="/admin/events/new"
          className="rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)]"
        >
          Новое событие
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск"
          aria-label="Поиск"
          className={INPUT}
        />
        <label className="block max-w-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Видимость
          </span>
          <select
            value={filterVisible}
            onChange={(event) => updateFilter("is_visible", event.target.value)}
            aria-label="Видимость"
            className={INPUT}
          >
            <option value="">Все</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </select>
        </label>
      </div>

      {error ? (
        <p
          className="mb-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {items === null && !error ? <p className="text-sm text-white/45">Загрузка…</p> : null}
      {items ? (
        <AdminTable rows={items} columns={columns} getRowKey={(row) => row.id} />
      ) : null}

      {next ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mt-4 rounded-md border border-white/[0.08] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] disabled:opacity-60"
        >
          Показать ещё
        </button>
      ) : null}
    </div>
  );
}
