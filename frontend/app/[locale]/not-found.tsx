import { Link } from "@/i18n/navigation";

export default function LocaleNotFound() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl md:text-8xl font-serif font-black uppercase tracking-widest text-accent mb-4">
          404
        </h1>
        <p className="text-xl md:text-2xl text-foreground/50 mb-8 font-sans">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 border border-accent text-accent font-serif font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-black transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}