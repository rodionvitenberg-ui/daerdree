import GameForm from "../GameForm";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId) || gameId <= 0) {
    return <p className="text-sm text-white/45">Игра не найдена.</p>;
  }
  return <GameForm gameId={gameId} />;
}
