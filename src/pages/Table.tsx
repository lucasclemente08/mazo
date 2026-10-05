import React, { useState, useEffect } from 'react';
import { GameService, getLocalSession, clearLocalSession } from '../services/gameService';
import { Room, Player, Card as CardType } from '../types';
import { Hand } from '../components/Hand/Hand';
import { PlayerList } from '../components/PlayerList/PlayerList';
import { RoomQRCode } from '../components/QRCode/RoomQRCode';
import { Scoreboard } from '../components/Scoreboard';
import { TrucoGuide } from '../components/TrucoGuide';
import { Play, RotateCcw, QrCode, ArrowLeft, Users, RefreshCw } from 'lucide-react';

interface TableProps {
  roomCode: string;
  onLeave: () => void;
}

export const Table: React.FC<TableProps> = ({ roomCode, onLeave }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myHand, setMyHand] = useState<CardType[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [dealAnimation, setDealAnimation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const session = getLocalSession();

  const refreshState = async () => {
    if (!session || session.roomCode !== roomCode) {
      setLoadError('Ingresá a la mesa con tu nombre.');
      return;
    }
    try {
    const state = await GameService.getRoomState(roomCode, session.playerId);
    if (state && state.players.some((p) => p.id === session.playerId)) {
      setLoadError(null);
      setRoom(state.room);
      setPlayers(state.players);
      setMyHand(state.myHand);
      const current = state.players.find((p) => p.id === session.playerId);
      if (current) setMyPlayer(current);
    } else {
      setLoadError('La mesa no existe, venció o tu sesión ya no pertenece a ella.');
    }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la mesa.');
    }
  };

  useEffect(() => {
    refreshState();

    // Listen for tab sync / local state events
    const handleUpdate = (e: any) => {
      if (!e.detail || e.detail.roomCode === roomCode) {
        refreshState();
      }
    };
    window.addEventListener('mazo_local_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(refreshState, 2000); // Polling backup for seamless state

    return () => {
      window.removeEventListener('mazo_local_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [roomCode]);

  const isHost = myPlayer?.id === room?.hostPlayerId;
  const isDealer = myPlayer?.position === room?.dealerPosition;
  const canDeal = isHost || isDealer;
  const matchEnded = room?.scores?.some(score => score >= (room.scoreLimit ?? 30)) ?? false;
  const handleScore = async (team: 0 | 1, delta: number, limit?: 15 | 30) => {
    try {
      await GameService.updateScore(roomCode, team, delta, room?.scoreVersion ?? 0, limit);
    } finally {
      await refreshState();
    }
  };

  const handleDeal = async () => {
    if (!canDeal || loadingAction) return;
    try {
      setLoadingAction(true);
      setDealAnimation(true);
      await GameService.dealCards(roomCode);
      await refreshState();
      setTimeout(() => setDealAnimation(false), 600);
    } catch (err: any) {
      setDealAnimation(false);
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleNewRound = async () => {
    if (!canDeal || loadingAction) return;
    try {
      setLoadingAction(true);
      setDealAnimation(true);
      await GameService.newRound(roomCode, room?.roundNumber);
      await refreshState();
      setTimeout(() => setDealAnimation(false), 600);
    } catch (err: any) {
      setDealAnimation(false);
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExit = async () => {
    if (loadingAction || !confirm(isHost ? '¿Cerrar la mesa y borrar sus cartas para todos?' : '¿Salir de la mesa? Podés volver a entrar con este navegador.')) return;
    setLoadingAction(true);
    try {
      await GameService.leaveRoom(roomCode);
      onLeave();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo salir. Reintentá.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loadError) {
    return <div className="min-h-screen felt-bg flex flex-col items-center justify-center gap-4 p-6 text-white">
      <p role="alert">{loadError}</p>
      <button onClick={refreshState}>Reintentar</button>
      <button onClick={() => { clearLocalSession(); onLeave(); }}>Volver al inicio</button>
    </div>;
  }
  if (!room || !myPlayer) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4 felt-bg text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-stone-300 text-sm">Cargando mesa {roomCode}...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen felt-bg text-white justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowGuide(true)} className="min-h-11 px-3 rounded-xl border border-stone-600 text-xs text-amber-200 hover:bg-stone-800">Guía</button>
          <button
            onClick={handleExit}
            disabled={loadingAction}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 transition-colors"
            title="Salir de la mesa"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-300/80">
                MESA
              </span>
              <span className="font-mono font-bold text-amber-300 tracking-wider">
                {room.code}
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              Ronda #{room.roundNumber} · {players.length}/{room.maxPlayers} jugadores
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Invitar</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="my-auto py-4 flex flex-col items-center justify-center w-full">
        {room.status === 'waiting' && (
          <div className="w-full flex flex-col items-center text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Users className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-amber-100">Esperando jugadores</h2>
              <p className="text-xs text-stone-300 mt-1">
                Faltan {Math.max(0, room.maxPlayers - players.length)} jugador(es) para completar la mesa.
              </p>
            </div>

            <button
              onClick={() => setShowQRModal(true)}
              className="py-2.5 px-4 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-2 border border-stone-600/50"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Mostrar código QR para escanear</span>
            </button>
          </div>
        )}

        {/* Hand View with Hold-to-Reveal */}
        <div className={`w-full transition-opacity duration-300 ${dealAnimation ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}`}>
          <Hand
            key={room.roundNumber}
            cards={myHand}
            playerName={myPlayer.name}
            isCurrentUser={true}
          />
        </div>
      </main>

      {/* Bottom Controls / Seating list */}
      <footer className="space-y-4 pt-2">
        <Scoreboard room={room} players={players} isHost={isHost} disabled={loadingAction} onUpdate={handleScore} />
        {/* Deal / Next Hand Action Buttons */}
        <div className="w-full">
          {room.status === 'waiting' ? (
            <button
              onClick={handleDeal}
              disabled={loadingAction || !canDeal || matchEnded || players.length !== room.maxPlayers}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-wide shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                canDeal
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-amber-500/20 hover:from-amber-400'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{canDeal ? 'REPARTIR CARTAS' : 'ESPERANDO AL REPARTIDOR'}</span>
            </button>
          ) : (
            <button
              onClick={handleNewRound}
              disabled={loadingAction || !canDeal || matchEnded}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-wide shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                canDeal
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 border border-emerald-400/40'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              <span>{canDeal ? 'NUEVA MANO' : 'ESPERANDO NUEVA MANO'}</span>
            </button>
          )}
        </div>

        {/* Player Seating list */}
        <PlayerList
          players={players}
          hostPlayerId={room.hostPlayerId}
          dealerPosition={room.dealerPosition}
          currentUserId={myPlayer.id}
        />
        <p className="text-center text-[11px] text-stone-400">{isHost ? 'Salir cierra la mesa y borra las cartas.' : 'Las mesas abandonadas se borran automáticamente.'} No guardamos historial.</p>
      </footer>
      {showGuide && <TrucoGuide onClose={() => setShowGuide(false)} />}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white p-2 rounded-full bg-black/40"
            >
              ✕
            </button>
            <RoomQRCode code={room.code} />
          </div>
        </div>
      )}
    </div>
  );
};
