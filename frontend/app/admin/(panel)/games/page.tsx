"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTable, { type AdminColumn } from "@/components/admin/AdminTable";
import {
  AdminApiError,
  adminNextPath,
  listGames,
  type AdminGameListItem,
} from "@/lib/admin-api";

const INPUT =
  "w-full max-w-sm rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)]";

function flag(value: boolean) {
  return value ? "да" : "нет";
}

export default function GamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(query.trim());
  const [filterActive, setFilterActive] = useState(searchParams.get("is_active") ?? "");
  const [filterRu, setFilterRu] = useState(searchParams.get("is_visible_ru") ?? "");
  const [filterEn, setFilterEn] = useState(searchParams.get("is_visible_en") ?? "");
  const [items, setItems] = useState<AdminGameListItem[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(query.trim());
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("search", query.trim());
      else params.delete("search");
      router.replace(`/admin/games?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/admin/games?${params.toString()}`, { scroll: false });
    if (key === "is_active") setFilterActive(value);
    else if (key === "is_visible_ru") setFilterRu(value);
    else setFilterEn(value);
    setItems(null);
    setNext(null);
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterActive) params.set("is_active", filterActive);
    if (filterRu) params.set("is_visible_ru", filterRu);
    if (filterEn) params.set("is_visible_en", filterEn);
    listGames(search, params.toString() ? `/api/admin/games/?${params.toString()}` : undefined)
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
  }, [search, filterActive, filterRu, filterEn]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const data = await listGames(search, next);
      setItems((current) => [...(current ?? []), ...(data.results ?? [])]);
      setNext(adminNextPath(data.next));
      setError("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
    } finally {
      setLoadingMore(false);
    }
  }

  const columns: AdminColumn<AdminGameListItem>[] = [
    { key: "title_ru", header: "Название (ru)", render: (row) => row.title_ru || "—" },
    { key: "title_en", header: "Название (en)", render: (row) => row.title_en || "—" },
    { key: "is_active", header: "Активна", render: (row) => flag(row.is_active) },
    { key: "is_visible_ru", header: "RU", render: (row) => flag(row.is_visible_ru) },
    { key: "is_visible_en", header: "EN", render: (row) => flag(row.is_visible_en) },
    {
      key: "edit",
      header: "",
      className: "w-28 text-right",
      render: (row) => (
        <Link href={`/admin/games/${row.id}`} className="admin-accent text-sm font-semibold">
          Изменить
        </Link>
      ),
    },
  ];

  const filterRow = (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
          Показ на сайте
        </span>
        <select
          value={filterActive}
          onChange={(event) => updateFilter("is_active", event.target.value)}
          aria-label="Активна"
          className={INPUT}
        >
          <option value="">Все</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
          Видимость (RU)
        </span>
        <select
          value={filterRu}
          onChange={(event) => updateFilter("is_visible_ru", event.target.value)}
          aria-label="Видимость RU"
          className={INPUT}
        >
          <option value="">Все</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
          Видимость (EN)
        </span>
        <select
          value={filterEn}
          onChange={(event) => updateFilter("is_visible_en", event.target.value)}
          aria-label="Видимость EN"
          className={INPUT}
        >
          <option value="">Все</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[26px] font-medium">Игры</h1>
        <Link
          href="/admin/games/new"
          className="rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)]"
        >
          Новая игра
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
      </div>

      {filterRow}

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