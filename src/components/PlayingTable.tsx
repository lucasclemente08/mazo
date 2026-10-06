import { useEffect, useState } from 'react';
import { ArrowRight, Check, Trophy } from 'lucide-react';
import { Room, Player } from '../types';
import { Card } from './Card/Card';
import { side } from '../utils/truco';

export function PlayingTable({ room, players, myId }: { room: Room; players: Player[]; myId: string }) {
  const [viewedTrick, setViewedTrick] = useState<number | null>(null);
  const play = room.play;
  useEffect(() => { setViewedTrick(null); }, [room.roundNumber, play?.trick]);
  if (!play) return null;
  const name = (position: number) => players.find(p => p.position === position)?.name ?? 'Jugador';
  const sideName = (winner: number) => players.filter(p => side(p.position, room) === winner).map(p => p.name).join(' y ');
  const current = players.find(p => p.position === play.turn);
  const me = players.find(p => p.id === myId);
  const finished = play.winner !== null;
  const yourTurn = !finished && current?.id === myId;
  const displayedTrick = viewedTrick ?? play.trick;
  const history = displayedTrick !== play.trick;
  const result = play.results[displayedTrick];
  const playedCount = play.cards.filter(c => c.trick === displayedTrick).length;
  const ordered = [...players].sort((a, b) => a.position - b.position);

  return <section aria-labelledby="table-title" className="playing-table">
    <header className="table-heading">
      <div><p className="table-eyebrow">Cartas compartidas</p><h2 id="table-title">La mesa</h2></div>
      <span className="table-round">Mano {room.roundNumber}</span>
    </header>
    <div className={`table-turn ${yourTurn ? 'table-turn-yours' : ''}`} role="status" aria-live="polite" aria-atomic="true">
      <span className="table-turn-icon" aria-hidden="true">{finished ? <Trophy /> : <ArrowRight />}</span>
      <div><p className="table-turn-title">{finished ? `Mano ganada por ${sideName(play.winner!)}` : yourTurn ? 'Te toca jugar' : `Juega ${current?.name ?? '…'}`}</p>
        <p className="table-turn-help">{finished ? 'Anoten los puntos antes de repartir la próxima mano.' : yourTurn ? 'Abajo, tocá «Ver y elegir carta» para tirar.' : 'Podés mirar tus cartas mientras esperás tu turno.'}</p>
      </div>
    </div>
    <div className="table-roles"><span><strong>Mano:</strong> {name(play.mano)}</span><span><strong>Reparte:</strong> {name(room.dealerPosition)}</span></div>
    <p className="table-mano-help">El mano empieza y tiene ventaja si hay empate en los cantos.</p>
    <nav className="table-tricks" aria-label="Bazas de esta mano">
      {[0, 1, 2].map(trick => {
        const completed = play.results[trick];
        const available = trick <= play.trick;
        return <button type="button" key={trick} disabled={!available} aria-pressed={displayedTrick === trick}
          onClick={() => setViewedTrick(trick === play.trick ? null : trick)}>
          <span>{trick + 1}.ª baza</span>
          <small>{completed ? completed.winner === null ? 'Parda' : me && side(me.position, room) === completed.winner ? 'Tu lado ganó' : 'Otro lado ganó' : finished ? 'No se jugó' : trick === play.trick ? 'En juego' : 'Por jugar'}</small>
        </button>;
      })}
    </nav>
    <div className="table-baza-heading"><h3>{history ? `Cartas de la ${displayedTrick + 1}.ª baza` : `Baza ${displayedTrick + 1} de 3`}</h3>
      <span>{result ? result.winner === null ? 'Empate · parda' : 'Terminada' : `${playedCount}/${room.maxPlayers} cartas`}</span>
    </div>
    <div className={`table-seats ${room.maxPlayers === 6 ? 'table-seats-six' : ''}`}>
      {ordered.map(player => {
        const played = play.cards.find(c => c.trick === displayedTrick && c.playerId === player.id);
        const active = !history && !finished && play.turn === player.position;
        const mine = player.id === myId;
        const sameSide = me && side(me.position, room) === side(player.position, room);
        const relation = room.maxPlayers === 3 ? `${mine ? 'Vos · ' : ''}${player.position === room.dealerPosition ? 'Gallo · juega solo' : sameSide ? mine ? 'En pareja' : 'Tu compañero' : 'Pareja rival'}` : mine ? 'Vos' : sameSide ? 'Tu compañero' : 'Rival';
        return <article key={player.id} className={`table-seat ${active ? 'table-seat-active' : ''} ${mine ? 'table-seat-mine' : ''}`} aria-label={`${player.name}, ${relation}${active ? ', tiene el turno' : ''}`}>
          <div className="table-seat-name"><span className="table-seat-number" aria-hidden="true">{player.position + 1}</span><h4 title={player.name}>{player.name}</h4></div>
          <p className="table-seat-relation">{relation}{player.position === play.mano ? ' · Mano' : ''}</p>
          {played ? <div className="table-played-card" key={`${displayedTrick}-${played.card.id}`}><Card card={played.card} className="table-card" /></div>
            : <div className="table-card-slot" aria-label={active ? 'Esperando su carta' : 'Todavía no jugó'}><span aria-hidden="true">{active ? <ArrowRight /> : '—'}</span><span>{active ? 'Su turno' : 'Sin jugar'}</span></div>}
          <span className={`table-seat-status ${active ? 'table-seat-status-active' : ''}`}>{played ? <><Check aria-hidden="true" /> Ya jugó</> : active ? mine ? 'Tirá tu carta' : 'Está eligiendo' : 'Espera su turno'}</span>
        </article>;
      })}
    </div>
    {result && <p className="table-result">{result.winner === null ? 'Baza empatada: parda.' : `Esta baza la ganó ${sideName(result.winner)}.`}</p>}
    {history ? <button type="button" className="table-return" onClick={() => setViewedTrick(null)}>Volver a la baza actual <ArrowRight aria-hidden="true" /></button>
      : <p className="table-footnote">Todos ven estas cartas. Tus cartas sin jugar quedan privadas abajo.</p>}
  </section>;
}
