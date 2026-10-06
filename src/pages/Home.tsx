import React, { useState, useEffect } from 'react';
import { GameService } from '../services/gameService';
import { isSupabaseConfigured } from '../services/supabase';
import { TrucoGuide } from '../components/TrucoGuide';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { CardsIcon, PlayersIcon, JoinIcon, GuideIcon } from '../components/Icons';
import { BrandIntro, LearningLinks } from '../seo/SeoPage';

interface HomeProps {
  onRoomCreated: (code: string) => void;
  onRoomJoined: (code: string) => void;
  initialRoomCode?: string;
}

export const Home: React.FC<HomeProps> = ({ onRoomCreated, onRoomJoined, initialRoomCode = '' }) => {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [hostName, setHostName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4 | 6>(4);
  const [joinName, setJoinName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (initialRoomCode) { setRoomCode(initialRoomCode); setView('join'); }
    else if (new URLSearchParams(window.location.search).has('crear')) setView('create');
    else if (new URLSearchParams(window.location.search).has('unirme')) setView('join');
  }, [initialRoomCode]);

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
    <div className="home-shell flex flex-col min-h-screen felt-bg text-white justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header / Brand */}
      <BrandIntro />

      {/* Main Switcher */}
      <div className="my-auto w-full">
        {!isSupabaseConfigured && <p className="mb-4 text-center text-xs text-amber-200" role="status">
          Demo local: las mesas solo funcionan en este navegador. Configurá Supabase para conectar celulares.
        </p>}
        {error && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {view === 'main' && (
          <div className="view-enter space-y-4">
            <button
              onClick={() => {
                setError(null);
                setView('create');
              }}
              className="action-primary w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-lg tracking-wide shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CardsIcon className="w-5 h-5 text-stone-900" />
              <span>Crear mesa</span>
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
              className="action-secondary w-full py-4 px-6 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-100 font-bold text-base border border-stone-700/80 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <JoinIcon className="w-5 h-5 text-amber-400" />
              <span>Unirme con código</span>
            </button>
          </div>
        )}

        {view === 'create' && (
          <form
            onSubmit={handleCreate}
            className="view-enter bg-stone-900/90 border border-emerald-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-100">Crear una mesa</h2>
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
                Tu nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Lucas"
                aria-label="Tu nombre" autoComplete="nickname" value={hostName}
                maxLength={30}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-stone-700 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Cantidad de jugadores
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([2, 3, 4, 6] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    aria-pressed={maxPlayers === num}
                    onClick={() => setMaxPlayers(num)}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                      maxPlayers === num
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                        : 'bg-black/30 text-stone-300 border-stone-700 hover:border-stone-600'
                    }`}
                  >
                    <PlayersIcon className="w-4 h-4 mx-auto mb-1" />{num}<span className="sr-only"> jugadores</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-stone-300">
              <CardsIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Juego: <strong>{maxPlayers === 3 ? 'Truco Gallo' : 'Truco argentino'}</strong> · 3 cartas por jugador{maxPlayers === 3 && <span className="block mt-1">Puntos individuales. El repartidor juega solo y va rotando.</span>}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><LoaderCircle className="w-5 h-5 animate-spin" /><span role="status">Creando mesa…</span></>
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
            className="view-enter bg-stone-900/90 border border-emerald-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-100">Unirme a una mesa</h2>
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
                Código de la mesa
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Ej. 7K3P"
                aria-label="Código de la mesa" autoCapitalize="characters" spellCheck={false} value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 text-center tracking-widest text-2xl font-mono uppercase rounded-xl bg-black/40 border border-stone-700 text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan"
                aria-label="Tu nombre" autoComplete="nickname" value={joinName}
                maxLength={30}
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
                <><LoaderCircle className="w-5 h-5 animate-spin" /><span role="status">Entrando…</span></>
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
        <button type="button" onClick={() => setShowGuide(true)} className="inline-flex items-center justify-center gap-2 mb-4 min-h-11 px-5 rounded-xl border border-amber-300/30 text-amber-200 text-sm font-semibold hover:bg-amber-300/10"><GuideIcon className="w-5 h-5" />Cómo se juega · Cartas y puntos</button>
        <p>“La aplicación reparte. Los jugadores juegan.”</p>
        <p className="mt-1 text-stone-500">Sin registro · Sin anuncios · Cartas ocultas al soltar</p>
      </div>
      {view === 'main' && !initialRoomCode && <LearningLinks />}
      {showGuide && <TrucoGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};
