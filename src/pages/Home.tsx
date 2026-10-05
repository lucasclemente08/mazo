import React, { useState } from 'react';
import { GameService } from '../services/gameService';
import { Users, Sparkles, ArrowRight, Dices, Layers } from 'lucide-react';

interface HomeProps {
  onRoomCreated: (code: string) => void;
  onRoomJoined: (code: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onRoomCreated, onRoomJoined }) => {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [hostName, setHostName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 4 | 6>(4);
  const [joinName, setJoinName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Ingresá tu nombre');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { room } = await GameService.createRoom(hostName.trim(), maxPlayers);
      onRoomCreated(room.code);
    } catch (err: any) {
      setError(err.message || 'Error al crear mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setError('Ingresá tu nombre');
      return;
    }
    if (!roomCode.trim()) {
      setError('Ingresá el código de la mesa');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { room } = await GameService.joinRoom(roomCode.trim(), joinName.trim());
      onRoomJoined(room.code);
    } catch (err: any) {
      setError(err.message || 'Error al unirte a la mesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen felt-bg text-white justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header / Brand */}
      <div className="flex flex-col items-center pt-8 pb-4 text-center">
        <div className="relative mb-3">
          <div className="w-20 h-24 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-2xl rotate-3">
            <div className="w-full h-full bg-felt-dark rounded-[14px] flex flex-col items-center justify-center p-2 border border-amber-300/30">
              <span className="text-3xl">🃏</span>
              <span className="text-[10px] font-mono tracking-widest text-amber-300 font-bold mt-1">
                MAZO
              </span>
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/40 animate-pulse">
            <Sparkles className="w-3 h-3 text-emerald-300" />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-amber-100 uppercase">
          MAZO
        </h1>
        <p className="text-stone-300 text-sm mt-1 max-w-[260px]">
          Tu baraja física virtual compartida. Jugá al Truco sin cartas.
        </p>
      </div>

      {/* Main Switcher */}
      <div className="my-auto w-full">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {view === 'main' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                setView('create');
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-lg tracking-wide shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5 text-stone-900" />
              <span>CREAR MESA</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-stone-400 text-xs uppercase tracking-widest">
                o ingresá código
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              onClick={() => {
                setError(null);
                setView('join');
              }}
              className="w-full py-4 px-6 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-100 font-bold text-base border border-stone-700/80 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5 text-amber-400" />
              <span>TENGO UN CÓDIGO</span>
            </button>
          </div>
        )}

        {view === 'create' && (
          <form
            onSubmit={handleCreate}
            className="bg-stone-900/90 border border-emerald-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-100">Crear Nueva Mesa</h2>
              <button
                type="button"
                onClick={() => setView('main')}
                className="text-xs text-stone-400 hover:text-white"
              >
                Volver
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Tu Nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Lucas"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Cantidad de Jugadores
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 4, 6] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      maxPlayers === num
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-black/30 text-stone-300 border-stone-700 hover:border-stone-600'
                    }`}
                  >
                    {num} Jugadores
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-stone-300">
              <Dices className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Juego: <strong>Truco Argentino</strong> (3 cartas por jugador)</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Creando mesa...</span>
              ) : (
                <>
                  <span>CREAR Y COMPARTIR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {view === 'join' && (
          <form
            onSubmit={handleJoin}
            className="bg-stone-900/90 border border-emerald-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-100">Unirse a Mesa</h2>
              <button
                type="button"
                onClick={() => setView('main')}
                className="text-xs text-stone-400 hover:text-white"
              >
                Volver
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Código de la Mesa
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Ej. 7K3P"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 text-center tracking-widest text-2xl font-mono uppercase rounded-xl bg-black/40 border border-stone-700 text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Tu Nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <span>ENTRAR A LA MESA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="py-4 text-center text-[11px] text-stone-400">
        <p>“La aplicación reparte. Los jugadores juegan.”</p>
        <p className="mt-1 text-stone-500">Sin registro · Sin anuncios · Privacidad garantizada</p>
      </div>
    </div>
  );
};
