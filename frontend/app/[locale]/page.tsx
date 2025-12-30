import Hero from "@/components/Hero";
import Booking from "@/components/Booking";
import GamesMarquee from "@/components/GameMarquee";
import MenuTeaser from "@/components/MenuTeaser";
import ParallaxDivider from "@/components/ParallaxDivider";
import EventMasonry from "@/components/EventMasonry";
import CateringStory from "@/components/CateringStory";
import LocationSection from "@/components/LocationSection";
import Footer from "@/components/footer";
export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Booking />
      <CateringStory />
      <ParallaxDivider />
      <GamesMarquee />
      <MenuTeaser />
      <EventMasonry />
      <LocationSection /> 
    </main>
  );
}