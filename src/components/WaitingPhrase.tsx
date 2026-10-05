import { useEffect, useState } from 'react';
import { CardsIcon } from './Icons';

const phrases = [
  'La mesa se completa, el chamuyo ya empezó.',
  'Con un cuatro de copas también se puede mentir.',
  'Las cartas se mezclan; la confianza, no.',
  'El envido se cuenta. El truco se siente.',
  'Paciencia, que el ancho todavía está en el mazo.',
  'Cara de siete bravo, cartas de cuatro de copas.',
];

export function WaitingPhrase() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex(value => (value + 1) % phrases.length), 8000);
    return () => window.clearInterval(timer);
  }, []);
  return <aside aria-label="Mientras esperamos" className="waiting-phrase flex items-center justify-center gap-2 w-full my-3 px-3 py-3 rounded-xl text-amber-200/80 border border-amber-300/15 bg-emerald-950/30">
    <CardsIcon className="w-5 h-5 shrink-0" />
    <p key={index} className="view-enter text-center text-xs italic leading-relaxed">{phrases[index]}</p>
  </aside>;
}
