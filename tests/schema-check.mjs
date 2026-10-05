import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
await db.exec(sql);
await db.exec(sql); // Setup can be applied again without widening access.
const host = '00000000-0000-4000-8000-000000000001';
const guest = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
for (const id of [host,guest,other]) await db.query('insert into auth.users values($1)',[id]);
async function asUser(id, action) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec('set role authenticated');
  try { return await action(); } finally { await db.exec('reset role'); }
}
async function rpc(name,args) {
  return (await db.query(`select public.${name}(${args.map((_,i) => `$${i+1}`).join(',')}) result`,args)).rows[0].result;
}
const created = await asUser(host,() => rpc('mazo_create_room',['Host',2]));
const code = created.room.code;
await asUser(host,() => assert.rejects(rpc('mazo_deal',[code,false,1]),/complete/));
await asUser(guest,() => assert.rejects(rpc('mazo_join_room',[code,'Host']),/nombre/));
const joined = await asUser(guest,() => rpc('mazo_join_room',[code,'Guest']));
const rejoined = await asUser(guest,() => rpc('mazo_join_room',[code,'Ignored']));
assert.equal(joined.player.id,rejoined.player.id);
await asUser(other,() => assert.rejects(rpc('mazo_join_room',[code,'Third']),/completa/));
await asUser(guest,() => assert.rejects(rpc('mazo_deal',[code,false,1]),/anfitrión/));
await asUser(host,() => rpc('mazo_deal',[code,false,1]));
const h = await asUser(host,() => rpc('mazo_room_state',[code]));
const g = await asUser(guest,() => rpc('mazo_room_state',[code]));
assert.equal(h.myHand.length,3);
assert.equal(g.myHand.length,3);
assert.equal(new Set([...h.myHand,...g.myHand].map(c => c.id)).size,6);
assert.equal(await asUser(other,() => rpc('mazo_room_state',[code])),null);
for (const table of ['hands','players','rooms']) {
  await asUser(guest,() => assert.rejects(db.query(`select * from public.${table}`),/permission denied/));
}
await asUser(host,() => rpc('mazo_deal',[code,true,1]));
await asUser(host,() => assert.rejects(rpc('mazo_deal',[code,true,1]),/ronda cambió/));
const next = await asUser(guest,() => rpc('mazo_room_state',[code]));
assert.equal(next.room.roundNumber,2);
assert.equal(next.room.dealerPosition,1);
await asUser(other,() => assert.rejects(rpc('mazo_join_room',[code,'Late']),/comenzó/));
await db.exec('set role anon');
await assert.rejects(rpc('mazo_room_state',[code]),/permission denied/);
await db.exec('reset role');
await db.query("update public.rooms set expires_at = now() - interval '1 minute' where code = $1",[code]);
assert.equal(await asUser(host,() => rpc('mazo_room_state',[code])),null);
console.log('SQL checks passed: repeatable setup, identity, capacity, authorization, private hands, rounds, expiry.');
await db.close();
