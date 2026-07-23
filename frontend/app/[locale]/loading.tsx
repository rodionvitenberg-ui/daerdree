export default function Loading() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-accent font-serif tracking-widest text-xs animate-pulse uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}