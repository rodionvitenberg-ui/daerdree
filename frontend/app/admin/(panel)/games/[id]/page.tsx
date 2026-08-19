import GameForm from "../GameForm";

export default async function EditGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imageError?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const raw = query.imageError;
  const imageError = Array.isArray(raw) ? raw[0] : raw;
  const gameId = Number(id);
  if (!Number.isInteger(gameId) || gameId <= 0) {
    return <p className="text-sm text-white/45">Игра не найдена.</p>;
  }
  return <GameForm gameId={gameId} imageError={imageError} />;
}
