-- Supabase Schema for MAZO
-- Run this in your Supabase SQL Editor

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  host_player_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players IN (2, 4, 6)),
  dealer_position INTEGER NOT NULL DEFAULT 0,
  round_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 hours')
);

-- 2. Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  session_token_hash TEXT,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create hands table (Private hand storage)
CREATE TABLE IF NOT EXISTS public.hands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  cards JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, player_id, round_number)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hands ENABLE ROW LEVEL SECURITY;

-- 5. Public read for active rooms
CREATE POLICY "Allow public read for rooms"
ON public.rooms FOR SELECT
USING (true);

-- 6. Public read for players in same room
CREATE POLICY "Allow public read for players"
ON public.players FOR SELECT
USING (true);

-- 7. Only player can read their own hand (Anti-cheat privacy rule)
CREATE POLICY "Allow players to only view their own hands"
ON public.hands FOR SELECT
USING (player_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

-- Enable Realtime for rooms, players, hands
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
