// Core domain models for MAZO

export type Suit = 'espada' | 'basto' | 'oro' | 'copa';

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface Card {
  id: string; // e.g. "1-espada"
  value: CardValue;
  suit: Suit;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Player {
  id: string;
  roomId: string;
  name: string;
  position: number;
  sessionTokenHash?: string;
  connected: boolean;
  createdAt?: string;
}

export interface Room {
  id: string;
  code: string;
  hostPlayerId: string;
  status: RoomStatus;
  maxPlayers: 2 | 3 | 4 | 6;
  dealerPosition: number;
  roundNumber: number;
  gameType: 'truco';
  scores?: number[];
  scoreLimit?: 15 | 30;
  scoreVersion?: number;
  createdAt?: string;
  play?: PlayState;
}

export interface PlayedCard { card: Card; playerId: string; position: number; trick: number }
export interface TrickResult { winner: number | null; leader: number }
export interface PlayState {
  version: number; mano: number; turn: number | null; trick: number;
  cards: PlayedCard[]; results: TrickResult[]; winner: number | null;
}

export interface Hand {
  id?: string;
  roomId: string;
  playerId: string;
  roundNumber: number;
  cards: Card[];
}

export interface GameConfig {
  id: string;
  name: string;
  deck: 'spanish40';
  cardsPerPlayer: number;
  allowedPlayers: number[];
}

export const TRUCO_CONFIG: GameConfig = {
  id: 'truco',
  name: 'Truco Argentino',
  deck: 'spanish40',
  cardsPerPlayer: 3,
  allowedPlayers: [2, 3, 4, 6],
};
