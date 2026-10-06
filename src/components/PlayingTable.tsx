import { Room, Player } from '../types';
import { Card } from './Card/Card';
import { side } from '../utils/truco';

export function PlayingTable({ room, players, myId }: { room: Room; players: Player[]; myId: string }) {
  const play = room.play;
  if (!play) return null;
  const name = (position: number) => players.find(p => p.position === position)?.name ?? 'Jugador';
  const sideName = (winner: number) => players.filter(p => side(p.position, room) === winner).map(p => p.name).join(' y ');
  const current = players.find(p => p.position === play.turn);
  const finished = play.winner !== null;
  return <section aria-label="Cartas sobre la mesa" className="playing-table w-full mb-5 rounded-3xl border border-amber-300/25 p-4">
    <div className="flex items-center justify-between gap-3 mb-3 text-xs text-amber-200/80">
      <span>Mano: <strong>{name(play.mano)}</strong></span><span>Baza {play.trick + 1} / 3</span>
    </div>
    <p role="status" className="text-center font-bold text-amber-100 mb-1">
      {finished ? `Ganó la mano: ${sideName(play.winner!)}` : current?.id === myId ? 'Tu turno: tirá una carta' : `Turno de ${current?.name ?? '…'}`}
    </p>
    <p className="text-center text-xs text-stone-300 mb-4">{finished ? 'Anoten los puntos del truco y los cantos en el marcador.' : 'Las cartas tiradas son visibles para toda la mesa.'}</p>
    <div className={`grid gap-3 ${room.maxPlayers % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {players.map(player => {
        const played = play.cards.find(c => c.trick === play.trick && c.playerId === player.id);
        return <div key={player.id} className={`table-seat rounded-2xl p-2 flex flex-col items-center gap-2 ${play.turn === player.position ? 'table-seat-active' : ''}`}>
          <span className="text-xs text-center truncate w-full text-amber-100">{player.name}{player.id === myId ? ' (vos)' : ''}</span>
          {played ? <div className="table-played-card"><Card card={played.card} className="table-card" /></div>
            : <div className="table-card table-card-slot flex items-center justify-center text-xs text-stone-400 text-center p-2">{play.turn === player.position ? 'Le toca jugar' : 'Sin tirar'}</div>}
        </div>;
      })}
    </div>
    {play.results.length > 0 && <div className="mt-3 space-y-2">{play.results.map((result, i) => <details key={i} className="text-xs text-stone-300">
      <summary className="cursor-pointer py-2 hover:text-amber-200">Baza {i + 1}: {result.winner === null ? 'Parda' : sideName(result.winner)} · ver cartas</summary>
      <div className="flex flex-wrap gap-3 py-2">{play.cards.filter(c => c.trick === i).map(c => <div key={c.card.id} className="flex flex-col items-center gap-1"><Card card={c.card} className="table-card" /><span>{name(c.position)}</span></div>)}</div>
    </details>)}</div>}
  </section>;
}
