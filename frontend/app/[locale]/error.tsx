"use client";

import { useEffect } from "react";
import Link from "next/link";

function isChunkError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message?.includes("Failed to load chunk") ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("Loading CSS chunk")
  );
}

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  // ── Chunk-load-specific UI ─────────────────────────────────────
  if (isChunkError(error)) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center px-4">
          {/* Lucide-style wifi-off icon inline; no extra dependency */}
          <svg
            className="mx-auto mb-8 w-16 h-16 text-foreground/30"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19.5v.01M8.29 15.71a5.25 5.25 0 0 1 7.42 0M5.64 13.05a9 9 0 0 1 12.72 0"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18"
            />
          </svg>

          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-widest text-foreground/80 mb-4">
            Connection Lost
          </h1>
          <p className="text-lg md:text-xl text-foreground/40 mb-8 font-sans max-w-md mx-auto leading-relaxed">
            Your internet connection seems unstable. The page couldn't load
            all required resources. Please try again when the connection is
            restored.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 border border-white/20 text-foreground font-serif font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-colors"
            >
              Reload Page
            </button>
            <Link
              href="/"
              className="px-8 py-3 border border-accent text-accent font-serif font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-black transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic error UI ───────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase tracking-widest text-red-500 mb-4">500</h1>
        <p className="text-xl md:text-2xl text-foreground/50 mb-8 font-sans">Something went wrong</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="px-8 py-3 border border-white/20 text-foreground font-serif font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-colors">Try again</button>
          <Link href="/" className="px-8 py-3 border border-accent text-accent font-serif font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-black transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
