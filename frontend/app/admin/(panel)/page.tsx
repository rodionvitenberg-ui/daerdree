import Link from "next/link";

const LINKS = [
  { href: "/admin/games", label: "Игры" },
  { href: "/admin/dictionaries", label: "Словари" },
  { href: "/admin/events", label: "События" },
  { href: "/admin/bookings", label: "Брони" },
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-serif text-[26px] font-medium">Панель</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[10px] border border-white/[0.07] bg-[hsl(56,100%,3%)] px-5 py-4 text-sm font-semibold transition-colors hover:border-[hsl(187,83%,26%)] hover:bg-[hsl(56,100%,5%)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
