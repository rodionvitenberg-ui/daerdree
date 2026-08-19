import EventForm from "../EventForm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return <p className="text-sm text-white/45">Событие не найдено.</p>;
  }
  return <EventForm eventId={eventId} />;
}
