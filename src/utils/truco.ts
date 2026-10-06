import { Card, PlayedCard, PlayState, Room } from '../types';

export function cardRank(card: Card): number {
  if (card.value === 1 && card.suit === 'espada') return 14;
  if (card.value === 1 && card.suit === 'basto') return 13;
  if (card.value === 7 && card.suit === 'espada') return 12;
  if (card.value === 7 && card.suit === 'oro') return 11;
  return ({ 3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1 })[card.value];
}
export function side(position: number, room: Pick<Room, 'maxPlayers' | 'dealerPosition'>): number {
  return room.maxPlayers === 3 ? (position === room.dealerPosition ? 0 : 1) : position % 2;
}
export function initialPlay(room: Room): PlayState {
  const mano = (room.dealerPosition + 1) % room.maxPlayers;
  return { version: 0, mano, turn: mano, trick: 0, cards: [], results: [], winner: null };
}
export function advancePlay(room: Room, previous: PlayState, played: PlayedCard): PlayState {
  const play: PlayState = { ...previous, version: previous.version + 1, cards: [...previous.cards, played], results: [...previous.results] };
  const trick = play.cards.filter(c => c.trick === play.trick);
  if (trick.length < room.maxPlayers) { play.turn = (played.position + 1) % room.maxPlayers; return play; }
  const highest = Math.max(...trick.map(c => cardRank(c.card)));
  const best = trick.filter(c => cardRank(c.card) === highest);
  const winner = best.every(c => side(c.position, room) === side(best[0].position, room)) ? side(best[0].position, room) : null;
  // A parda preserves the player who opened this trick.
  const leader = winner === null ? trick[0].position : best[0].position;
  play.results.push({ winner, leader });
  const [first, second, third] = play.results.map(r => r.winner);
  if (play.results.length === 2) {
    if (first !== null && (second === first || second === null)) play.winner = first;
    else if (first === null && second !== null) play.winner = second;
  } else if (play.results.length === 3) play.winner = third ?? first ?? second ?? side(play.mano, room);
  if (play.winner !== null) play.turn = null;
  else { play.trick++; play.turn = leader; }
  return play;
}
