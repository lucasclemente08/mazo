import type { CSSProperties, FC } from 'react';
import type { Card as CardType, Suit } from '../../types';
interface CardProps { card?: CardType; faceDown?: boolean; className?: string; onClick?: () => void; style?: CSSProperties }
export const SuitIcon: FC<{ suit: Suit; className?: string }> = ({ suit, className = 'w-6 h-6' }) => <svg viewBox="0 0 32 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
  {suit === 'espada' && <><path d="m16 2 5 8-3 17h-4L11 10Z" fill="currentColor" fillOpacity=".14"/><path d="M16 6v21M7 28h18M13 29v7h6v-7M12 38h8"/></>}
  {suit === 'basto' && <><path d="M14 35c-2-6-5-15-6-22C7 6 10 2 16 2s9 4 8 11c-1 7-4 16-6 22Z" fill="currentColor" fillOpacity=".18"/><path d="M13 36h6M14 38h4M14 8l-2 5m6-5 2 5M12 18l4 3 4-3M14 25h4"/></>}
  {suit === 'oro' && <><circle cx="16" cy="20" r="13" fill="currentColor" fillOpacity=".18"/><circle cx="16" cy="20" r="9.5"/><path d="m16 13 2 4 4 .6-3 3 .7 4.4-3.7-2-3.7 2 .7-4.4-3-3 4-.6Z" fill="currentColor" fillOpacity=".6"/></>}
  {suit === 'copa' && <><path d="M6 5h20v7c0 7-4 12-10 12S6 19 6 12Z" fill="currentColor" fillOpacity=".18"/><path d="M7 9h18M10 15h12M16 24v10M11 35h10l3 3H8ZM6 11H3v4c0 4 3 6 7 6m16-10h3v4c0 4-3 6-7 6"/></>}
</svg>;
export const Card: FC<CardProps> = ({ card, faceDown = false, className = '', onClick, style }) => {
  if (faceDown || !card) return <div onClick={onClick} style={style} role="img" aria-label="Carta oculta" className={`playing-card card-back ${className}`}><div className="card-back-frame"><span className="card-back-diamond">T</span><span className="card-back-name">TRUCARDO</span></div></div>;
  return <div onClick={onClick} style={style} role="img" aria-label={`${card.value} de ${card.suit}`} className={`playing-card card-face card-suit-${card.suit} ${className}`}>
    <div className="card-corner card-corner-top" aria-hidden="true"><span>{card.value}</span><SuitIcon suit={card.suit} /></div>
    <div className={`card-art ${card.value > 7 ? 'card-art-court' : ''}`} aria-hidden="true">
      {card.value > 7 ? <><span className="card-court-crown">♛</span><SuitIcon suit={card.suit} /><span className="card-court-name">{card.value === 10 ? 'Sota' : card.value === 11 ? 'Caballo' : 'Rey'}</span></>
        : <div className={`card-pips ${card.value === 1 ? 'card-pips-single' : ''}`}>{Array.from({length:card.value},(_,index)=><SuitIcon key={index} suit={card.suit} />)}</div>}
    </div>
    <span className="card-suit-name" aria-hidden="true">{card.suit}</span>
    <div className="card-corner card-corner-bottom" aria-hidden="true"><span>{card.value}</span><SuitIcon suit={card.suit} /></div>
  </div>;
};
