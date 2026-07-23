"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

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