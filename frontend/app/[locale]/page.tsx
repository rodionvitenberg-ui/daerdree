import Hero from "@/components/Hero";
import Booking from "@/components/Booking";
import GamesMarquee from "@/components/GameMarquee";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Booking />
      <GamesMarquee />
      
      {/* Дальше пойдут другие блоки */}
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <h2 className="text-white text-4xl font-serif">Block 2 (Concept) Placeholder</h2>
      </div>
    </main>
  );
}