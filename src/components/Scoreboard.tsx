import { useState } from 'react';
import type { Player, Room } from '../types';

interface Props {
  room: Room;
  players: Player[];
  isHost: boolean;
  disabled: boolean;
  onUpdate: (team: 0 | 1, delta: number, limit?: 15 | 30) => Promise<void>;
}

export function Scoreboard({ room, players, isHost, disabled, onUpdate }: Props) {
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scores = room.scores ?? [0, 0];
  const limit = room.scoreLimit ?? 30;
  const winner = scores.findIndex(score => score >= limit);
  const update = async (team: 0 | 1, delta: number, goal?: 15 | 30) => {
    if (busy || disabled) return;
    setBusy(true); setError('');
    try { await onUpdate(team, delta, goal); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron guardar los puntos.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Anotador de puntos" className="rounded-2xl border border-amber-300/20 bg-stone-950/70 p-4">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-semibold text-amber-100">Anotador</h2>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-stone-400">A</span>
        {([15, 30] as const).map(goal => <button key={goal} type="button" aria-pressed={limit === goal}
          disabled={!isHost || busy || disabled || room.status !== 'waiting' || scores.some(score => score !== 0)}
          onClick={() => update(0, 0, goal)} className={`min-h-10 min-w-10 rounded-lg border ${limit === goal ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-stone-700 text-stone-400'} disabled:cursor-default`}>{goal}</button>)}
      </div>
    </div>
    <div className="grid grid-cols-2 divide-x divide-stone-700">
      {([0, 1] as const).map(team => <div key={team} className={`text-center ${team === 0 ? 'pr-3' : 'pl-3'}`}>
        <h3 className="text-sm font-semibold text-stone-200">Equipo {team + 1}</h3>
        <p className="text-[11px] text-stone-400 min-h-8 break-words">{players.filter(p => p.position % 2 === team).map(p => p.name).join(' · ') || 'Esperando jugadores'}</p>
        <p key={scores[team]} className="score-value font-mono text-5xl tabular-nums text-amber-100 my-2" aria-label={`Equipo ${team + 1}: ${scores[team]} puntos`}>{scores[team]}</p>
        <p className="text-xs text-stone-400 mb-3">{winner === team ? 'Ganó el partido' : limit === 30 ? (scores[team] < 15 ? 'Malas' : 'Buenas') : 'Puntos'}</p>
        {isHost && <div className="flex justify-center gap-2">
          <button type="button" disabled={busy || disabled || scores[team] < amount} onClick={() => update(team, -amount)}
            aria-label={`Restar ${amount} puntos al equipo ${team + 1}`} className="min-h-11 px-3 rounded-lg border border-stone-600 text-stone-300 hover:bg-stone-800 disabled:opacity-30">−{amount}</button>
          <button type="button" disabled={busy || disabled || winner !== -1} onClick={() => update(team, amount)}
            aria-label={`Sumar ${amount} puntos al equipo ${team + 1}`} className="min-h-11 px-3 rounded-lg bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 disabled:opacity-30">+{amount}</button>
        </div>}
      </div>)}
    </div>
    {isHost ? <label className="flex items-center justify-between gap-3 border-t border-stone-700 pt-3 mt-4 text-xs text-stone-300">
      Puntos por anotación
      <input aria-label="Puntos por anotación" type="number" inputMode="numeric" min={1} max={30} value={amount}
        onChange={e => setAmount(Math.max(1, Math.min(30, Math.trunc(Number(e.target.value) || 1))))}
        className="w-16 min-h-11 rounded-lg bg-stone-900 border border-stone-600 text-center text-base text-white" />
    </label> : <p className="mt-3 text-center text-xs text-stone-400">El anfitrión anota los puntos para todos.</p>}
    {busy && <p role="status" className="mt-2 text-xs text-amber-200">Guardando puntos…</p>}
    {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
    {winner !== -1 && <p role="status" className="mt-3 text-center text-sm text-amber-200">Ganó el equipo {winner + 1}. {isHost ? 'Podés corregir el marcador o cerrar la mesa para borrar el partido.' : 'El anfitrión puede cerrar la mesa.'}</p>}
  </section>;
}
