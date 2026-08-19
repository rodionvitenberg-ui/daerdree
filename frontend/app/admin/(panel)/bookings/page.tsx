"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTable, { type AdminColumn } from "@/components/admin/AdminTable";
import {
  AdminApiError,
  adminNextPath,
  listBookings,
  type AdminBooking,
  type BookingStatus,
} from "@/lib/admin-api";

const INPUT =
  "w-full max-w-sm rounded-md border border-white/[0.08] bg-[hsl(60,4%,9%)] px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(187,83%,26%)]";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "На рассмотрении",
  confirmed: "Подтверждено",
  rejected: "Отклонено",
};

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

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(query.trim());
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [items, setItems] = useState<AdminBooking[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(query.trim());
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) params.set("search", query.trim());
      else params.delete("search");
      router.replace(`/admin/bookings?${params.toString()}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    router.replace(`/admin/bookings?${params.toString()}`, { scroll: false });
    setStatus(value);
    setItems(null);
    setNext(null);
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    listBookings(status, params.toString() ? `/api/admin/bookings/?${params.toString()}` : undefined)
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
  }, [search, status]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const data = await listBookings(status, next);
      setItems((current) => [...(current ?? []), ...(data.results ?? [])]);
      setNext(adminNextPath(data.next));
      setError("");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось загрузить.");
    } finally {
      setLoadingMore(false);
    }
  }

  const columns: AdminColumn<AdminBooking>[] = [
    { key: "name", header: "Имя", render: (row) => row.name || "—" },
    { key: "date", header: "Дата", render: (row) => row.date || "—" },
    { key: "guests", header: "Гостей", render: (row) => row.guests || "—" },
    {
      key: "status",
      header: "Статус",
      render: (row) => STATUS_LABEL[row.status] ?? row.status,
    },
    {
      key: "created_at",
      header: "Создано",
      render: (row) => formatCreatedAt(row.created_at),
    },
    {
      key: "edit",
      header: "",
      className: "w-28 text-right",
      render: (row) => (
        <Link href={`/admin/bookings/${row.id}`} className="admin-accent text-sm font-semibold">
          Изменить
        </Link>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[26px] font-medium">Брони</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск (имя / контакт)"
          aria-label="Поиск"
          className={INPUT}
        />
        <label className="block max-w-sm">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Статус
          </span>
          <select
            value={status}
            onChange={(event) => updateStatus(event.target.value)}
            aria-label="Статус"
            className={INPUT}
          >
            <option value="">Все</option>
            <option value="pending">На рассмотрении</option>
            <option value="confirmed">Подтверждено</option>
            <option value="rejected">Отклонено</option>
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
        <AdminTable
          rows={items}
          columns={columns}
          getRowKey={(row) => row.id}
          getRowClassName={(row) =>
            row.status === "pending" ? "bg-[hsla(42,90%,50%,0.12)]" : undefined
          }
        />
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
