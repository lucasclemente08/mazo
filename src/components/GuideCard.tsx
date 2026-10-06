import { Card } from './Card/Card';
import type { Suit, CardValue } from '../types';

export function GuideCard({ value, suit }: { value: CardValue; suit: Suit }) {
  return <Card card={{id:`${value}-${suit}`,value,suit}} className="guide-playing-card" />;
}
