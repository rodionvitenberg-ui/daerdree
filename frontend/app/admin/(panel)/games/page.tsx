"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTable, {
  type AdminColumn,
  type SortDirection,
} from "@/components/admin/AdminTable";
import {
  AdminApiError,
  adminNextPath,
  listGames,
  type AdminGameListItem,
} from "@/lib/admin-api";

const INPUT =
  "w-full max-w-sm rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)]";

const SORTABLE_KEYS = ["title_ru", "title_en", "is_active", "is_visible_ru", "is_visible_en"];

function flag(value: boolean) {
  return value ? "да" : "нет";
}

function names(items: { name_ru: string }[]) {
  return items.map((item) => item.name_ru).join(", ") || "—";
}

export default function GamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(query.trim());
  const [items, setItems] = useState<AdminGameListItem[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(() => {
    const value = searchParams.get("ordering");
    if (value && SORTABLE_KEYS.includes(value.replace(/^-/, ""))) {
      return value.replace(/^-/, "");
    }
    return null;
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const value = searchParams.get("ordering") ?? "";
    return value.startsWith("-") ? "desc" : "asc";
  });

  const ordering = sortKey ? `${sortDirection === "desc" ? "-" : ""}${sortKey}` : "";

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

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (ordering) params.set("ordering", ordering);
    else params.delete("ordering");
    router.replace(`/admin/games?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordering]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (ordering) params.set("ordering", ordering);
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
  }, [search, ordering]);

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

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setItems(null);
    setNext(null);
  }

  const columns: AdminColumn<AdminGameListItem>[] = [
    {
      key: "title_ru",
      header: "Название (ru)",
      sortable: true,
      render: (row) => row.title_ru || "—",
    },
    {
      key: "title_en",
      header: "Название (en)",
      sortable: true,
      render: (row) => row.title_en || "—",
    },
    {
      key: "categories",
      header: "Категории",
      render: (row) => names(row.categories),
    },
    {
      key: "tags",
      header: "Теги",
      render: (row) => names(row.tags),
    },
    {
      key: "is_active",
      header: "Активна",
      sortable: true,
      render: (row) => flag(row.is_active),
    },
    {
      key: "is_visible_ru",
      header: "RU",
      sortable: true,
      render: (row) => flag(row.is_visible_ru),
    },
    {
      key: "is_visible_en",
      header: "EN",
      sortable: true,
      render: (row) => flag(row.is_visible_en),
    },
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

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск"
        aria-label="Поиск"
        className={INPUT}
      />

      {error ? (
        <p
          className="mb-4 mt-4 rounded-[10px] border border-[hsl(357,100%,55%)]/30 px-4 py-2.5 text-sm text-[hsl(357,100%,55%)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {items === null && !error ? <p className="mt-4 text-sm text-white/45">Загрузка…</p> : null}
      {items ? (
        <div className="mt-4">
          <AdminTable
            rows={items}
            columns={columns}
            getRowKey={(row) => row.id}
            sortable
            resizable
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSort}
          />
        </div>
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