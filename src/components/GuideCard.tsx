import { SuitIcon } from './Card/Card';
import type { Suit } from '../types';

export function GuideCard({ value, suit }: { value: number; suit: Suit }) {
  return <span role="img" aria-label={`${value} de ${suit}`} className={`guide-card guide-card-${suit}`}>
    <span className="guide-card-value">{value}</span>
    <SuitIcon suit={suit} className="guide-card-suit" />
    <span className="guide-card-label">{suit}</span>
  </span>;
}
