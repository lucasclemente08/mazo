import { supabase } from './supabase';
import type { Card, Player, Room } from '../types';

export interface RemoteState { room: Room; players: Player[]; myHand: Card[] }

let authentication: Promise<NonNullable<typeof supabase>> | null = null;

async function authenticateOnce() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    const result = await supabase.auth.signInAnonymously();
    if (result.error) throw result.error;
  }
  return supabase;
}

function authenticate() {
  if (!authentication) {
    authentication = authenticateOnce().finally(() => { authentication = null; });
  }
  return authentication;
}

export async function gameRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = await authenticate();
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
