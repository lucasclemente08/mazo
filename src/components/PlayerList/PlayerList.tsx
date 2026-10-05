import React from 'react';
import { Player } from '../../types';
import { Crown, Sparkles, Wifi, WifiOff } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  hostPlayerId: string;
  dealerPosition: number;
  currentUserId?: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostPlayerId,
  dealerPosition,
  currentUserId,
}) => {
  return (
    <div className="w-full bg-stone-900/60 border border-emerald-900/40 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wider text-amber-200/70 font-semibold">
        <span>Jugadores en la mesa ({players.length})</span>
        <span>Orden de ronda</span>
      </div>

      <div className="space-y-2">
        {players.map((player, idx) => {
          const isHost = player.id === hostPlayerId;
          const isDealer = player.position === dealerPosition;
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isMe
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-white'
                  : 'bg-black/20 border-white/5 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-mono text-stone-400">
                  #{idx + 1}
                </span>

                <div className="flex items-center gap-1.5 font-medium">
                  <span className={isMe ? 'text-amber-200 font-bold' : ''}>
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      TÚ
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDealer && (
                  <span className="flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Reparte
                  </span>
                )}
                {isHost && (
                  <span className="flex items-center gap-1 text-[11px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">
                    <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    Host
                  </span>
                )}
                {player.connected ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
