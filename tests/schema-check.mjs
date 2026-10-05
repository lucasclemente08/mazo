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
assert.deepEqual(created.room.scores,[0,0]);
await asUser(guest,() => assert.rejects(rpc('mazo_score',[code,0,1,null,0]),/anfitrión/));
await asUser(host,() => rpc('mazo_score',[code,0,0,15,0]));
assert.equal((await asUser(host,() => rpc('mazo_room_state',[code]))).room.scoreLimit,15);
await asUser(host,() => assert.rejects(rpc('mazo_score',[code,0,1,null,0]),/marcador cambió/));
await asUser(host,() => rpc('mazo_score',[code,0,0,30,1]));
await asUser(host,() => assert.rejects(rpc('mazo_score',[code,0,-1,null,2]),/negativo/));
await asUser(host,() => assert.rejects(rpc('mazo_score',[code,2,1,null,2]),/inválidos/));
await asUser(host,() => assert.rejects(rpc('mazo_score',[code,0,31,null,2]),/inválidos/));
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
assert.deepEqual((await db.query('select distinct round_number from public.hands')).rows,[{round_number:2}]);
await asUser(other,() => assert.rejects(rpc('mazo_leave_room',[code]),/pertenecés/));
await asUser(host,() => assert.rejects(rpc('mazo_cleanup',[]),/permission denied/));
await db.query("update public.rooms set expires_at = now() + interval '10 minutes' where code = $1",[code]);
await asUser(other,() => rpc('mazo_room_state',[code]));
assert.equal((await db.query("select expires_at < now() + interval '11 minutes' unchanged from public.rooms where code=$1",[code])).rows[0].unchanged,true);
await asUser(host,() => rpc('mazo_room_state',[code]));
assert.equal((await db.query("select expires_at > now() + interval '29 minutes' renewed from public.rooms where code=$1",[code])).rows[0].renewed,true);
await asUser(other,() => assert.rejects(rpc('mazo_join_room',[code,'Late']),/comenzó/));
await db.exec('set role anon');
await assert.rejects(rpc('mazo_room_state',[code]),/permission denied/);
await db.exec('reset role');
await db.query("update public.rooms set expires_at = now() - interval '1 minute' where code = $1",[code]);
assert.equal(await asUser(host,() => rpc('mazo_room_state',[code])),null);
assert.equal(await rpc('mazo_cleanup',[]),1);
for (const table of ['rooms','players','hands']) assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0);
const closing = await asUser(host,() => rpc('mazo_create_room',['Host',2]));
await asUser(host,() => rpc('mazo_score',[closing.room.code,0,0,15,0]));
await asUser(guest,() => rpc('mazo_join_room',[closing.room.code,'Guest']));
await asUser(guest,() => rpc('mazo_leave_room',[closing.room.code]));
assert.equal((await db.query('select connected from public.players where id=$1',[(await asUser(guest,() => rpc('mazo_join_room',[closing.room.code,'Guest']))).player.id])).rows[0].connected,true);
await asUser(host,() => rpc('mazo_deal',[closing.room.code,false,1]));
await asUser(host,() => assert.rejects(rpc('mazo_score',[closing.room.code,0,0,30,1]),/antes de comenzar/));
await asUser(host,() => rpc('mazo_score',[closing.room.code,0,14,null,1]));
await asUser(host,() => rpc('mazo_deal',[closing.room.code,true,1]));
assert.equal((await asUser(guest,() => rpc('mazo_room_state',[closing.room.code]))).room.scores[0],14);
await asUser(host,() => rpc('mazo_score',[closing.room.code,0,4,null,2]));
assert.equal((await asUser(guest,() => rpc('mazo_room_state',[closing.room.code]))).room.scores[0],15);
await asUser(host,() => assert.rejects(rpc('mazo_deal',[closing.room.code,true,2]),/terminó/));
await asUser(host,() => assert.rejects(rpc('mazo_score',[closing.room.code,1,1,null,3]),/terminó/));
await asUser(host,() => rpc('mazo_score',[closing.room.code,0,-1,null,3]));
await asUser(host,() => rpc('mazo_deal',[closing.room.code,true,2]));
await asUser(host,() => rpc('mazo_leave_room',[closing.room.code]));
for (const table of ['rooms','players','hands']) assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0);
console.log('SQL checks passed: identity, authorization, private hands, no round history, expiry renewal, cascading cleanup and host closure.');
await db.close();
