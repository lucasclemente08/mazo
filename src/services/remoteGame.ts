import { supabase } from './supabase';
import type { Card, Player, Room } from '../types';

export interface RemoteState { room: Room; players: Player[]; myHand: Card[] }

let authentication: Promise<NonNullable<typeof supabase>> | null = null;

async function authenticateOnce(validateIdentity: boolean) {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  let session = data.session;
  if (session && validateIdentity) {
    const current = await supabase.auth.getUser();
    if (current.error) {
      if (!['user_not_found', 'session_not_found', 'refresh_token_not_found'].includes(current.error.code || '')) throw current.error;
      await supabase.auth.signOut({ scope: 'local' });
      session = null;
    }
  }
  if (!session) {
    const result = await supabase.auth.signInAnonymously();
    if (result.error) throw result.error;
  }
  return supabase;
}

function authenticate(validateIdentity: boolean) {
  if (!authentication) {
    authentication = authenticateOnce(validateIdentity).finally(() => { authentication = null; });
  }
  return authentication;
}

export async function gameRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = await authenticate(name === 'mazo_create_room' || name === 'mazo_join_room');
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
