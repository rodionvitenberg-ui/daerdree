"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { adminLogout } from "@/lib/admin-api";

const NAV = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/games", label: "Игры" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/tags", label: "Теги" },
  { href: "/admin/dictionaries", label: "Словари" },
  { href: "/admin/events", label: "События" },
  { href: "/admin/bookings", label: "Брони" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    try {
      await adminLogout();
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={`rounded-[7px] px-3.5 py-2.5 text-sm transition-colors ${
              active
                ? "font-semibold text-[hsl(187,83%,26%)]"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/90"
            }`}
          >
            {active ? <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[hsl(187,83%,26%)] align-middle" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="mt-auto border-t border-white/[0.08] px-4 py-4">
      <p className="truncate text-sm text-white/70">{username}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 text-sm text-white/40 transition-colors hover:text-[hsl(187,83%,26%)]"
      >
        Выйти
      </button>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {open ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/[0.08] bg-[hsl(56,100%,3%)] transition-transform duration-200 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-serif text-lg font-medium" onClick={() => setOpen(false)}>
            Daerdree
          </Link>
          <button
            type="button"
            className="rounded-md p-1 text-white/50 md:hidden"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        {nav}
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3 md:hidden">
          <button
            type="button"
            aria-label="Открыть меню"
            aria-expanded={open}
            className="rounded-md p-1 text-white/70"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-base font-medium">Daerdree Admin</span>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
