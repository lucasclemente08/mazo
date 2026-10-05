import { Room, Player, Card } from '../types';
import { createSpanishDeck, shuffleDeck, dealCards } from '../utils/deck';
import { supabase, isSupabaseConfigured } from './supabase';

interface StoredSession {
  roomCode: string;
  playerId: string;
  playerName: string;
}

const SESSION_STORAGE_KEY = 'mazo_session';
const LOCAL_ROOMS_KEY = 'mazo_local_rooms';

export function getLocalSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalSession(session: StoredSession) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// Generate human-friendly 4-character room codes like 7K3P
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// --- Local In-Memory / LocalStorage Mock for testing without backend setup ---
interface LocalRoomState {
  room: Room;
  players: Player[];
  hands: Record<string, Card[]>; // playerId -> Card[]
}

function getLocalState(roomCode: string): LocalRoomState | null {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || '{}');
    return all[roomCode] || null;
  } catch {
    return null;
  }
}

function saveLocalState(roomCode: string, state: LocalRoomState) {
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || '{}');
    all[roomCode] = state;
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(all));

    // Dispatch custom event for multi-tab testing on the same machine
    window.dispatchEvent(new CustomEvent('mazo_local_update', { detail: { roomCode } }));
  } catch (e) {
    console.error(e);
  }
}

export class GameService {
  /**
   * Create a new room
   */
  static async createRoom(
    hostName: string,
    maxPlayers: 2 | 4 | 6 = 4
  ): Promise<{ room: Room; player: Player }> {
    const code = generateRoomCode();
    const hostPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const roomId = 'r_' + Math.random().toString(36).substring(2, 9);

    const room: Room = {
      id: roomId,
      code,
      hostPlayerId,
      status: 'waiting',
      maxPlayers,
      dealerPosition: 0,
      roundNumber: 1,
      gameType: 'truco',
      createdAt: new Date().toISOString(),
    };

    const hostPlayer: Player = {
      id: hostPlayerId,
      roomId,
      name: hostName,
      position: 0,
      connected: true,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: roomErr } = await supabase.from('rooms').insert({
          id: room.id,
          code: room.code,
          host_player_id: room.hostPlayerId,
          status: room.status,
          max_players: room.maxPlayers,
          dealer_position: room.dealerPosition,
          round_number: room.roundNumber,
        });
        if (roomErr) throw roomErr;

        const { error: playerErr } = await supabase.from('players').insert({
          id: hostPlayer.id,
          room_id: room.id,
          name: hostPlayer.name,
          position: hostPlayer.position,
          connected: true,
        });
        if (playerErr) throw playerErr;
      } catch (err) {
        console.warn('Supabase insert failed, falling back to local simulation', err);
      }
    }

    // Always keep state synced locally so the app works seamlessly offline / for demo
    saveLocalState(code, {
      room,
      players: [hostPlayer],
      hands: {},
    });

    saveLocalSession({
      roomCode: code,
      playerId: hostPlayerId,
      playerName: hostName,
    });

    return { room, player: hostPlayer };
  }

  /**
   * Join an existing room
   */
  static async joinRoom(
    code: string,
    playerName: string
  ): Promise<{ room: Room; player: Player }> {
    const normalizedCode = code.trim().toUpperCase();

    // Check local store first
    const local = getLocalState(normalizedCode);
    if (!local) {
      throw new Error(`La mesa ${normalizedCode} no existe.`);
    }

    // Check if player is reconnecting
    const existingPlayer = local.players.find(
      (p) => p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      existingPlayer.connected = true;
      saveLocalState(normalizedCode, local);
      saveLocalSession({
        roomCode: normalizedCode,
        playerId: existingPlayer.id,
        playerName: existingPlayer.name,
      });
      return { room: local.room, player: existingPlayer };
    }

    // Check if full
    if (local.players.length >= local.room.maxPlayers) {
      throw new Error('La mesa ya está completa.');
    }

    const newPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: newPlayerId,
      roomId: local.room.id,
      name: playerName,
      position: local.players.length,
      connected: true,
      createdAt: new Date().toISOString(),
    };

    local.players.push(newPlayer);
    saveLocalState(normalizedCode, local);
    saveLocalSession({
      roomCode: normalizedCode,
      playerId: newPlayerId,
      playerName: newPlayer.name,
    });

    return { room: local.room, player: newPlayer };
  }

  /**
   * Deal cards (Fisher-Yates) and advance dealer position
   */
  static async dealCards(roomCode: string): Promise<Record<string, Card[]>> {
    const local = getLocalState(roomCode);
    if (!local) throw new Error('Mesa no encontrada');

    const deck = shuffleDeck(createSpanishDeck());
    const hands = dealCards(deck, local.players.length, 3);

    const handsMap: Record<string, Card[]> = {};
    local.players.forEach((p, idx) => {
      handsMap[p.id] = hands[idx] || [];
    });

    local.room.status = 'playing';
    local.hands = handsMap;

    saveLocalState(roomCode, local);
    return handsMap;
  }

  /**
   * Start a new round: increments round_number, rotates dealer, redeals
   */
  static async newRound(roomCode: string): Promise<Record<string, Card[]>> {
    const local = getLocalState(roomCode);
    if (!local) throw new Error('Mesa no encontrada');

    // Rotate dealer position
    local.room.dealerPosition = (local.room.dealerPosition + 1) % Math.max(1, local.players.length);
    local.room.roundNumber += 1;

    // Deal fresh cards
    const deck = shuffleDeck(createSpanishDeck());
    const hands = dealCards(deck, local.players.length, 3);

    const handsMap: Record<string, Card[]> = {};
    local.players.forEach((p, idx) => {
      handsMap[p.id] = hands[idx] || [];
    });

    local.hands = handsMap;
    saveLocalState(roomCode, local);
    return handsMap;
  }

  /**
   * Fetch current state for a room
   */
  static async getRoomState(
    roomCode: string,
    playerId: string
  ): Promise<{ room: Room; players: Player[]; myHand: Card[] } | null> {
    const local = getLocalState(roomCode);
    if (!local) return null;

    return {
      room: local.room,
      players: local.players,
      myHand: local.hands[playerId] || [],
    };
  }
}
