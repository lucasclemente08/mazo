-- Complete setup/update: execute this file and enable Anonymous Sign-Ins.
begin;
create table if not exists public.rooms (
 id text primary key, code text unique not null, host_player_id text not null,
 status text not null default 'waiting' check(status in ('waiting','playing','finished')),
 max_players integer not null check(max_players in (2,4,6)), dealer_position integer not null default 0,
 round_number integer not null default 1, created_at timestamptz default now(),
 expires_at timestamptz default now() + interval '30 minutes'
);
create table if not exists public.players (
 id text primary key, room_id text not null references public.rooms(id) on delete cascade,
 name text not null, position integer not null, connected boolean default true, created_at timestamptz default now()
);
alter table public.players add column if not exists auth_user_id uuid references auth.users(id);
alter table public.rooms alter column expires_at set default now() + interval '30 minutes';
create index if not exists rooms_expiry on public.rooms(expires_at);
create unique index if not exists players_room_owner on public.players(room_id,auth_user_id);
create index if not exists players_owner on public.players(auth_user_id);
create table if not exists public.hands (
 id uuid primary key default gen_random_uuid(), room_id text not null references public.rooms(id) on delete cascade,
 player_id text not null references public.players(id) on delete cascade, round_number integer not null,
 cards jsonb not null, created_at timestamptz default now(), unique(room_id,player_id,round_number)
);
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.hands enable row level security;
drop policy if exists "Allow public read for rooms" on public.rooms;
drop policy if exists "Allow public read for players" on public.players;
drop policy if exists "Allow players to only view their own hands" on public.hands;
revoke all on public.rooms,public.players,public.hands from anon,authenticated;

create or replace function public.mazo_room_state(room_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.rooms; p public.players;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into r from public.rooms where code = upper(trim(room_code)) and expires_at > now() for update;
 if not found then return null; end if;
 select * into p from public.players where room_id = r.id and auth_user_id = auth.uid();
 if not found then return null; end if;
 -- Renew only once per minute, after verifying membership. No activity history.
 if r.expires_at < now() + interval '29 minutes' then
  update public.rooms set expires_at = now() + interval '30 minutes' where id = r.id;
 end if;
 return jsonb_build_object(
  'room',jsonb_build_object('id',r.id,'code',r.code,'hostPlayerId',r.host_player_id,'status',r.status,
   'maxPlayers',r.max_players,'dealerPosition',r.dealer_position,'roundNumber',r.round_number,'gameType','truco','createdAt',r.created_at),
  'players',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'roomId',s.room_id,'name',s.name,
   'position',s.position,'connected',s.connected,'createdAt',s.created_at) order by s.position)
   from public.players s where s.room_id = r.id),'[]'::jsonb),
  'myHand',coalesce((select h.cards from public.hands h where h.room_id = r.id and h.player_id = p.id
   and h.round_number = r.round_number),'[]'::jsonb));
end $$;

create or replace function public.mazo_create_room(player_name text,capacity integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rid text := gen_random_uuid()::text; pid text := gen_random_uuid()::text; c text; state jsonb; attempt integer;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 if capacity is null or capacity not in (2,4,6) then raise exception 'Cantidad inválida'; end if;
 if player_name is null or length(trim(player_name)) not between 1 and 30 then raise exception 'Nombre inválido'; end if;
 for attempt in 1..10 loop
  c := upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
  begin
   insert into public.rooms(id,code,host_player_id,max_players) values(rid,c,pid,capacity);
   exit;
  exception when unique_violation then
   if attempt = 10 then raise exception 'Reintentá crear la mesa.'; end if;
  end;
 end loop;
 insert into public.players(id,room_id,name,position,auth_user_id) values(pid,rid,trim(player_name),0,auth.uid());
 state := public.mazo_room_state(c);
 return jsonb_build_object('room',state->'room','player',state->'players'->0);
end $$;

create or replace function public.mazo_join_room(room_code text,player_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.rooms; p public.players; seat integer; state jsonb; player_json jsonb;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 if player_name is null or length(trim(player_name)) not between 1 and 30 then raise exception 'Nombre inválido'; end if;
 select * into r from public.rooms where code = upper(trim(room_code)) and expires_at > now() for update;
 if not found then raise exception 'La mesa no existe o venció.'; end if;
 select * into p from public.players where room_id = r.id and auth_user_id = auth.uid();
 if found then
  update public.players set connected = true where id = p.id;
 else
  if r.status <> 'waiting' then raise exception 'La partida ya comenzó.'; end if;
  select count(*) into seat from public.players where room_id = r.id;
  if seat >= r.max_players then raise exception 'La mesa ya está completa.'; end if;
  if exists(select 1 from public.players where room_id = r.id and lower(name) = lower(trim(player_name))) then
   raise exception 'Ese nombre ya está en la mesa. Elegí otro.';
  end if;
  insert into public.players(id,room_id,name,position,auth_user_id)
   values(gen_random_uuid()::text,r.id,trim(player_name),seat,auth.uid()) returning * into p;
 end if;
 state := public.mazo_room_state(r.code);
 select value into player_json from jsonb_array_elements(state->'players') where value->>'id' = p.id;
 return jsonb_build_object('room',state->'room','player',player_json);
end $$;

create or replace function public.mazo_deal(room_code text,next_round boolean,expected_round integer) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.rooms; actor public.players; p public.players; deck jsonb[]; card_offset integer := 0; total integer;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into r from public.rooms where code = upper(trim(room_code)) and expires_at > now() for update;
 if not found then raise exception 'Mesa no encontrada'; end if;
 select * into actor from public.players where room_id = r.id and auth_user_id = auth.uid();
 if not found then raise exception 'No pertenecés a la mesa'; end if;
 if actor.id <> r.host_player_id and actor.position <> r.dealer_position then
  raise exception 'Solo el anfitrión o repartidor puede repartir.';
 end if;
 if expected_round is null or expected_round <> r.round_number then raise exception 'La ronda cambió. Actualizá la mesa.'; end if;
 if next_round is null or (next_round and r.status <> 'playing') or (not next_round and r.status <> 'waiting') then
  raise exception 'La partida cambió. Actualizá la mesa.';
 end if;
 select count(*) into total from public.players where room_id = r.id;
 if total <> r.max_players then raise exception 'Esperá a que se complete la mesa.'; end if;
 if next_round then
  r.round_number := r.round_number + 1;
  r.dealer_position := (r.dealer_position + 1) % total;
 end if;
 select array_agg(card order by random()) into deck from (
  select jsonb_build_object('id',v::text || '-' || s,'value',v,'suit',s) card
  from unnest(array[1,2,3,4,5,6,7,10,11,12]) v cross join unnest(array['espada','basto','oro','copa']) s
 ) d;
 delete from public.hands where room_id = r.id;
 for p in select * from public.players where room_id = r.id order by position loop
  insert into public.hands(room_id,player_id,round_number,cards)
   values(r.id,p.id,r.round_number,jsonb_build_array(deck[card_offset+1],deck[card_offset+total+1],deck[card_offset+2*total+1]));
  card_offset := card_offset + 1;
 end loop;
 update public.rooms set status = 'playing',round_number = r.round_number,dealer_position = r.dealer_position where id = r.id;
end $$;

-- Ending a game deletes its room, players and hands together via cascading FKs.
create or replace function public.mazo_leave_room(room_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.rooms; p public.players;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into r from public.rooms where code = upper(trim(room_code)) for update;
 if not found then return; end if;
 select * into p from public.players where room_id = r.id and auth_user_id = auth.uid();
 if not found then raise exception 'No pertenecés a la mesa'; end if;
 if p.id = r.host_player_id then
  delete from public.rooms where id = r.id;
 else
  -- Retain the seat for reconnecting; no new player can take over its hand.
  update public.players set connected = false where id = p.id;
 end if;
end $$;

create or replace function public.mazo_cleanup() returns integer
language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
 delete from public.rooms where expires_at <= now() or status = 'finished';
 get diagnostics removed = row_count;
 return removed;
end $$;
revoke all on function public.mazo_cleanup() from public,anon,authenticated;

revoke all on function public.mazo_leave_room(text),public.mazo_room_state(text),public.mazo_create_room(text,integer),
 public.mazo_join_room(text,text),public.mazo_deal(text,boolean,integer) from public,anon;
grant execute on function public.mazo_leave_room(text),public.mazo_room_state(text),public.mazo_create_room(text,integer),
 public.mazo_join_room(text,text),public.mazo_deal(text,boolean,integer) to authenticated;
commit;
