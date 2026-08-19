import Link from "next/link";
import { cookies } from "next/headers";
import { adminFetch } from "@/lib/admin-api";

type Stats = {
  games: number;
  events: number;
  bookings_pending: number;
};

const CARD =
  "block rounded-[10px] border border-white/[0.07] bg-[hsl(56,100%,3%)] px-5 py-[18px] text-[hsl(0,13%,91%)] transition-colors hover:border-[hsl(187,83%,26%)] hover:bg-[hsl(56,100%,5%)]";

export default async function AdminDashboardPage() {
  const cookieHeader = (await cookies()).toString();
  const stats = await adminFetch<Stats>("/api/admin/stats/", {}, cookieHeader);

  const cards: { href: string; label: string; count: number | null }[] = [
    { href: "/admin/games", label: "Игры", count: stats.games },
    { href: "/admin/events", label: "События", count: stats.events },
    { href: "/admin/bookings", label: "Брони (ожидают)", count: stats.bookings_pending },
    { href: "/admin/dictionaries", label: "Словари", count: null },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-serif text-[26px] font-medium">Панель</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Link key={item.href} href={item.href} className={CARD}>
            <strong className="block text-sm font-semibold">{item.label}</strong>
            {item.count != null ? (
              <span className="mt-0.5 block text-xs text-white/35">{item.count}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
