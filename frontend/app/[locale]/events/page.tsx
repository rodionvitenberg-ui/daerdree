import { Metadata } from "next";
import EventsInterface from "@/components/events/EventsInterface";

export const metadata: Metadata = {
  title: "Events & Hire | Daerdree",
  description: "Join our public gaming events or hire the venue for your private party.",
};

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <EventsInterface />
    </main>
  );
}