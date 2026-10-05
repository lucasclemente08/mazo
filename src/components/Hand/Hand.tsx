import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../../types';
import { Card } from '../Card/Card';
import { CardsIcon } from '../Icons';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface HandProps {
  cards: CardType[];
  playerName: string;
  isCurrentUser?: boolean;
}

export const Hand: React.FC<HandProps> = ({
  cards,
  playerName,
  isCurrentUser = true,
}) => {
  const [revealed, setRevealed] = useState(false);
  const handKey = cards.map((card) => card.id).join(',');
  useEffect(() => { setRevealed(false); }, [handKey]);
  useEffect(() => {
    const hide = () => setRevealed(false);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  // Handlers for hold-to-reveal (touch & mouse)
  const startReveal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setRevealed(true);
  };

  const endReveal = () => {
    setRevealed(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Hand header / privacy alert */}
      <div className="flex items-center justify-between w-full px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-lg font-bold text-amber-100 tracking-wide">
            {playerName}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs bg-black/40 px-3 py-1 rounded-full text-amber-200/80 border border-amber-500/20 backdrop-blur-sm">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Mano privada</span>
        </div>
      </div>

      {/* Cards Display */}
      <div className="flex justify-center items-center gap-2.5 sm:gap-4 py-4 w-full">
        {cards.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-stone-400 border border-dashed border-stone-600/50 rounded-2xl w-full p-6 text-center">
            <CardsIcon className="w-9 h-9 mb-3 text-amber-200/60" />
            <p className="text-sm">Esperando que el repartidor entregue las cartas...</p>
          </div>
        ) : (
          cards.map((card, idx) => (
            <div
              key={card.id || idx}
              className="transition-transform duration-200"
              style={{
                transform: revealed
                  ? `translateY(${idx === 1 ? '-6px' : '0px'}) rotate(${(idx - 1) * 3}deg)`
                  : `rotate(${(idx - 1) * 2}deg)`,
              }}
            >
              <Card card={card} faceDown={!revealed} />
            </div>
          ))
        )}
      </div>

      {/* Privacy Hold-to-Reveal trigger */}
      {cards.length > 0 && isCurrentUser && (
        <div className="w-full px-4 mt-2">
          <button
            type="button"
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              startReveal(e);
            }}
            onPointerUp={endReveal}
            onPointerLeave={endReveal}
            onPointerCancel={endReveal}
            onLostPointerCapture={endReveal}
            onBlur={endReveal}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') startReveal(e); }}
            onKeyUp={endReveal}
            style={{ touchAction: 'none' }}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-150 shadow-lg active:scale-95 select-none ${
              revealed
                ? 'bg-amber-500 text-stone-950 shadow-amber-500/30'
                : 'bg-emerald-800/80 hover:bg-emerald-700/80 text-amber-100 border border-emerald-500/30'
            }`}
          >
            {revealed ? (
              <>
                <EyeOff className="w-5 h-5 animate-pulse text-stone-900" />
                <span className="text-base tracking-wide font-black">SOLTÁ PARA OCULTAR</span>
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 text-amber-300" />
                <span className="text-base tracking-wide">MANTENÉ APRETADO PARA MIRAR</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-stone-400 mt-2">
            Las cartas se ocultan al soltar o cambiar de pestaña.
          </p>
        </div>
      )}
    </div>
  );
};
