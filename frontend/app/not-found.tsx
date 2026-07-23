import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-black text-white flex items-center justify-center min-h-dvh font-sans">
        <div className="text-center px-4">
          <h1 className="text-6xl md:text-8xl font-serif font-black uppercase tracking-widest text-accent mb-4">
            404
          </h1>
          <p className="text-xl md:text-2xl text-white/50 mb-8">
            Page not found
          </p>
          <Link
            href="/en"
            className="inline-block px-8 py-3 border border-accent text-accent font-serif font-bold uppercase tracking-widest text-sm hover:bg-accent hover:text-black transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}