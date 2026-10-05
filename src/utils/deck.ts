import { Card, Suit, CardValue } from '../types';

export const SUITS: Suit[] = ['espada', 'basto', 'oro', 'copa'];
export const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

/**
 * Generates standard 40-card Spanish deck (Baraja Española)
 */
export function createSpanishDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: `${value}-${suit}`,
        value,
        suit,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Traditional deal simulation: 3 cards distributed one by one in rounds around the table
 */
export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number = 3
): Card[][] {
  if (!Number.isInteger(playerCount) || playerCount < 1 ||
      !Number.isInteger(cardsPerPlayer) || cardsPerPlayer < 1 ||
      playerCount * cardsPerPlayer > deck.length) {
    throw new Error('No hay suficientes cartas o la cantidad de jugadores es inválida.');
  }
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cardIndex = 0;

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < playerCount; p++) {
      hands[p].push(deck[cardIndex++]);
    }
  }

  return hands;
}
