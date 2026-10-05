import React from 'react';
import { Card as CardType, Suit } from '../../types';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const suitLabels: Record<Suit, string> = {
  espada: 'ESPADA',
  basto: 'BASTO',
  oro: 'ORO',
  copa: 'COPA',
};

// SVG icons for suits
export const SuitIcon: React.FC<{ suit: Suit; className?: string }> = ({ suit, className = "w-6 h-6" }) => {
  switch (suit) {
    case 'espada':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="m13 19 6-6" />
          <path d="m16 16 5 5" />
          <path d="m19 21 2-2" />
        </svg>
      );
    case 'basto':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 3c0 2 1 3 2 4l9 12a2 2 0 1 0 3-2L11 8c-1-1-2-2-2-4a3 3 0 0 0-3-1z" />
          <path d="M13 14l3-1" />
          <path d="M10 11l2-2" />
        </svg>
      );
    case 'oro':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="4.5" opacity="0.8" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeWidth="2" />
        </svg>
      );
    case 'copa':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 3h12v4a6 6 0 0 1-12 0V3z" />
          <path d="M12 13v6" />
          <path d="M8 21h8" />
        </svg>
      );
  }
};

const suitColors: Record<Suit, { text: string; bg: string; border: string; accent: string }> = {
  espada: {
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    accent: 'text-sky-600',
  },
  basto: {
    text: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    accent: 'text-emerald-700',
  },
  oro: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    accent: 'text-amber-500',
  },
  copa: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    accent: 'text-rose-600',
  },
};

export const Card: React.FC<CardProps> = ({
  card,
  faceDown = false,
  className = '',
  onClick,
  style,
}) => {
  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        style={style}
        className={`playing-card relative aspect-[5/8] w-28 sm:w-32 rounded-xl bg-gradient-to-br from-red-800 via-red-900 to-amber-950 p-2 shadow-2xl border-2 border-amber-400/60 select-none flex flex-col items-center justify-center transition-all duration-300 ${className}`}
      >
        <div className="absolute inset-1.5 rounded-lg border border-amber-300/40 border-dashed flex flex-col items-center justify-center p-2 bg-gradient-to-b from-black/20 to-black/40">
          <div className="w-10 h-10 rounded-full border border-amber-400/50 flex items-center justify-center bg-red-950/70 text-amber-300 font-serif font-black text-xs tracking-wider">
            MAZO
          </div>
          <div className="text-[10px] tracking-widest text-amber-200/60 uppercase mt-2 font-mono">
            🂠 🂠 🂠
          </div>
        </div>
      </div>
    );
  }

  const colors = suitColors[card.suit];

  return (
    <div
      onClick={onClick}
      style={style}
      className={`playing-card relative aspect-[5/8] w-28 sm:w-32 rounded-xl bg-[#faf7ef] border-2 border-[#d9d1be] p-2.5 shadow-2xl flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Left Value & Suit */}
      <div className={`flex flex-col items-start leading-none ${colors.text}`}>
        <span className="font-extrabold text-2xl font-serif tracking-tighter">
          {card.value}
        </span>
        <SuitIcon suit={card.suit} className="w-4 h-4 mt-0.5" />
      </div>

      {/* Center Art */}
      <div className="flex flex-col items-center justify-center my-auto py-1">
        <div className={`p-2.5 rounded-2xl ${colors.bg} ${colors.accent} shadow-inner`}>
          <SuitIcon suit={card.suit} className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>
        <span className="mt-1.5 text-[10px] font-bold tracking-widest uppercase text-stone-700 font-mono">
          {suitLabels[card.suit]}
        </span>
      </div>

      {/* Bottom Right Inverted Value */}
      <div className={`flex flex-col items-end leading-none rotate-180 ${colors.text}`}>
        <span className="font-extrabold text-2xl font-serif tracking-tighter">
          {card.value}
        </span>
        <SuitIcon suit={card.suit} className="w-4 h-4 mt-0.5" />
      </div>
    </div>
  );
};
