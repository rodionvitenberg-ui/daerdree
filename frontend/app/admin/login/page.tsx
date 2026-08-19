"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminCsrf, adminLogin, AdminApiError } from "@/lib/admin-api";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//") || raw.startsWith("/admin/login")) {
    return "/admin";
  }
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void adminCsrf().catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await adminLogin(username, password);
      router.push(safeNext(searchParams.get("next")));
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Не удалось войти.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-[10px] border border-white/[0.07] bg-[hsl(56,100%,3%)] px-7 py-8"
      >
        <h1 className="mb-6 font-serif text-2xl font-medium tracking-wide">
          Daerdree Admin
        </h1>

        <label className="mb-4 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Логин
          </span>
          <input
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
            className="w-full border-b border-white/20 bg-transparent py-2 text-base outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
            Пароль
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className="w-full border-b border-white/20 bg-transparent py-2 text-base outline-none transition-colors focus:border-[hsl(187,83%,26%)] disabled:opacity-50"
          />
        </label>

        {error ? (
          <p className="mb-4 text-sm text-[hsl(357,100%,55%)]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[hsl(187,83%,26%)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[hsl(187,65%,32%)] disabled:opacity-60"
        >
          Войти
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
