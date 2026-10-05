import { Room, Player, Card } from '../types';
import { createSpanishDeck, shuffleDeck, dealCards } from '../utils/deck';
import { isSupabaseConfigured } from './supabase';
import { gameRpc, type RemoteState } from './remoteGame';

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
    const value = raw ? JSON.parse(raw) : null;
    return value && typeof value.roomCode === 'string' && typeof value.playerId === 'string'
      && typeof value.playerName === 'string' ? value : null;
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
    throw new Error('No se pudo guardar la mesa. Revisá el almacenamiento del navegador.');
  }
}

export class GameService {
  static async updateScore(roomCode: string, team: 0 | 1, delta: number, expectedVersion: number, limit?: 15 | 30): Promise<void> {
    if (isSupabaseConfigured) {
      await gameRpc('mazo_score', { room_code: roomCode, team_index: team, points_delta: delta,
        score_limit: limit ?? null, expected_version: expectedVersion });
      return;
    }
    const state = getLocalState(roomCode);
    if (!state) throw new Error('Mesa no encontrada');
    const session = getLocalSession();
    if (session?.roomCode !== roomCode || session.playerId !== state.room.hostPlayerId) throw new Error('Solo el anfitrión puede anotar puntos.');
    if (expectedVersion !== (state.room.scoreVersion ?? 0)) throw new Error('El marcador cambió. Actualizá y reintentá.');
    const scores: [number, number] = [...(state.room.scores ?? [0, 0])];
    const goal = state.room.scoreLimit ?? 30;
    if (limit !== undefined) {
      if (![15, 30].includes(limit) || state.room.status !== 'waiting' || scores.some(score => score !== 0)) throw new Error('Elegí 15 o 30 antes de comenzar el partido.');
      state.room.scoreLimit = limit;
    } else {
      if (![0, 1].includes(team) || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 30) throw new Error('Puntos inválidos.');
      if (delta > 0 && scores.some(score => score >= goal)) throw new Error('El partido terminó. Podés corregir restando puntos.');
      if (scores[team] + delta < 0) throw new Error('El marcador no puede ser negativo.');
      scores[team] = Math.min(goal, scores[team] + delta);
    }
    state.room.scores = scores;
    state.room.scoreVersion = expectedVersion + 1;
    saveLocalState(roomCode, state);
  }

  static async leaveRoom(roomCode: string): Promise<void> {
    if (isSupabaseConfigured) {
      await gameRpc('mazo_leave_room', { room_code: roomCode });
    } else {
      const state = getLocalState(roomCode);
      const player = state?.players.find(p => p.id === getLocalSession()?.playerId);
      if (state && player?.id === state.room.hostPlayerId) {
        const all = JSON.parse(localStorage.getItem(LOCAL_ROOMS_KEY) || '{}');
        delete all[roomCode];
        localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('mazo_local_update', { detail: { roomCode } }));
      } else if (state && player) {
        player.connected = false;
        saveLocalState(roomCode, state);
      }
    }
    clearLocalSession();
  }

  /**
   * Create a new room
   */
  static async createRoom(
    hostName: string,
    maxPlayers: 2 | 4 | 6 = 4
  ): Promise<{ room: Room; player: Player }> {
    hostName = hostName.trim();
    if (!hostName || hostName.length > 30) throw new Error('Ingresá un nombre de hasta 30 caracteres.');
    if (![2, 4, 6].includes(maxPlayers)) throw new Error('Cantidad de jugadores inválida.');
    if (isSupabaseConfigured) {
      const result = await gameRpc<{ room: Room; player: Player }>('mazo_create_room', {
        player_name: hostName, capacity: maxPlayers,
      });
      saveLocalSession({ roomCode: result.room.code, playerId: result.player.id, playerName: result.player.name });
      return result;
    }
    let code = generateRoomCode();
    for (let attempt = 0; getLocalState(code); attempt++) {
      if (attempt >= 10) throw new Error('No se pudo generar un código libre. Reintentá.');
      code = generateRoomCode();
    }
    const hostPlayerId = crypto.randomUUID();
    const roomId = crypto.randomUUID();

    const room: Room = {
      id: roomId,
      code,
      hostPlayerId,
      status: 'waiting',
      maxPlayers,
      dealerPosition: 0,
      roundNumber: 1,
      gameType: 'truco',
      scores: [0, 0], scoreLimit: 30, scoreVersion: 0,
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

    // Demo mode stores room state only in this browser.
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
    playerName = playerName.trim();
    if (!/^[A-Z0-9]{4}$/.test(normalizedCode)) throw new Error('El código debe tener 4 caracteres.');
    if (!playerName || playerName.length > 30) throw new Error('Ingresá un nombre de hasta 30 caracteres.');
    if (isSupabaseConfigured) {
      const result = await gameRpc<{ room: Room; player: Player }>('mazo_join_room', {
        room_code: normalizedCode, player_name: playerName,
      });
      saveLocalSession({ roomCode: result.room.code, playerId: result.player.id, playerName: result.player.name });
      return result;
    }

    // Check local store first
    const local = getLocalState(normalizedCode);
    if (!local) {
      throw new Error(`La mesa ${normalizedCode} no existe.`);
    }

    // Check if player is reconnecting
    const session = getLocalSession();
    const existingPlayer = session?.roomCode === normalizedCode
      ? local.players.find((p) => p.id === session.playerId) : undefined;

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

    if (local.room.status !== 'waiting') throw new Error('La partida ya comenzó.');
    if (local.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
      throw new Error('Ese nombre ya está en la mesa. Elegí otro.');
    }
    // Check if full
    if (local.players.length >= local.room.maxPlayers) {
      throw new Error('La mesa ya está completa.');
    }

    const newPlayerId = crypto.randomUUID();
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
    if (isSupabaseConfigured) {
      await gameRpc('mazo_deal', { room_code: roomCode, next_round: false, expected_round: 1 });
      return {};
    }
    const local = getLocalState(roomCode);
    if (!local) throw new Error('Mesa no encontrada');
    this.validateDeal(local);
    if (local.room.status !== 'waiting') throw new Error('La partida ya comenzó.');

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
  static async newRound(roomCode: string, expectedRound?: number): Promise<Record<string, Card[]>> {
    if (isSupabaseConfigured) {
      await gameRpc('mazo_deal', { room_code: roomCode, next_round: true, expected_round: expectedRound });
      return {};
    }
    const local = getLocalState(roomCode);
    if (!local) throw new Error('Mesa no encontrada');
    this.validateDeal(local);
    if (local.room.status !== 'playing') throw new Error('Primero repartí la primera mano.');

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
    if (isSupabaseConfigured) return gameRpc<RemoteState | null>('mazo_room_state', { room_code: roomCode });
    const local = getLocalState(roomCode);
    if (!local) return null;

    return {
      room: local.room,
      players: local.players,
      myHand: local.hands[playerId] || [],
    };
  }

  private static validateDeal(state: LocalRoomState) {
    if (state.room.scores?.some(score => score >= (state.room.scoreLimit ?? 30))) throw new Error('El partido terminó. Cerrá la mesa o corregí el marcador.');
    const session = getLocalSession();
    const player = state.players.find((p) => p.id === session?.playerId);
    if (session?.roomCode !== state.room.code || !player ||
      (player.id !== state.room.hostPlayerId && player.position !== state.room.dealerPosition)) {
      throw new Error('Solo el anfitrión o repartidor puede repartir.');
    }
    if (state.players.length !== state.room.maxPlayers) throw new Error('Esperá a que se complete la mesa.');
  }
}
