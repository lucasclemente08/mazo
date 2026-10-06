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
const three = await asUser(host,() => rpc('mazo_create_room',['Gallo',3]));
assert.deepEqual(three.room.scores,[0,0,0]);
await asUser(guest,() => rpc('mazo_join_room',[three.room.code,'Segundo']));
await asUser(other,() => rpc('mazo_join_room',[three.room.code,'Tercero']));
await asUser(host,() => rpc('mazo_deal',[three.room.code,false,1]));
const threeHands = [];
for (const id of [host,guest,other]) threeHands.push(...(await asUser(id,() => rpc('mazo_room_state',[three.room.code]))).myHand);
assert.equal(threeHands.length,9);
assert.equal(new Set(threeHands.map(c=>c.id)).size,9);
await asUser(guest,() => assert.rejects(rpc('mazo_score',[three.room.code,2,3,null,0]),/anfitrión/));
await asUser(host,() => rpc('mazo_score',[three.room.code,2,3,null,0]));
assert.deepEqual((await asUser(other,() => rpc('mazo_room_state',[three.room.code]))).room.scores,[0,0,3]);
await asUser(host,() => rpc('mazo_deal',[three.room.code,true,1]));
assert.equal((await asUser(other,() => rpc('mazo_room_state',[three.room.code]))).room.dealerPosition,1);
await asUser(host,() => rpc('mazo_score',[three.room.code,2,30,null,1]));
await asUser(host,() => assert.rejects(rpc('mazo_deal',[three.room.code,true,2]),/terminó/));
await asUser(host,() => rpc('mazo_leave_room',[three.room.code]));
// Deterministic hands exercise the real RPC, including same-side ties and Gallo.
const users=[host,guest,other,'00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000006'];
for (const id of users.slice(3)) await db.query('insert into auth.users values($1)',[id]);
const fixtures=[
 {hands:[['3-oro','2-oro','4-oro'],['3-copa','2-copa','4-copa']],winner:1,leaders:[1,1,1]},
 {hands:[['3-oro','4-oro','2-oro'],['4-copa','3-copa','2-copa']],winner:0,leaders:[0,1,1]},
 {hands:[['3-oro','4-oro','2-oro'],['3-copa','5-copa','2-copa']],winner:1,leaders:[1,1]},
 {hands:[['3-oro','2-oro','4-oro'],['4-copa','2-copa','3-copa']],winner:0,leaders:[0,0]},
 {hands:[['1-espada','3-oro','4-oro'],['1-basto','2-oro','5-oro'],['7-espada','4-copa','6-oro']],winner:0,leaders:[0,0]},
 {hands:[['4-oro','2-oro','6-oro'],['1-basto','1-espada','7-oro'],['7-espada','3-oro','5-oro']],winner:1,leaders:[1,1]},
 {hands:[['4-oro','2-oro','6-oro'],['3-oro','1-basto','7-oro'],['5-oro','2-copa','6-copa'],['3-copa','1-espada','7-espada']],winner:1,leaders:[1,3]},
 {hands:[['4-oro','2-oro','6-oro'],['3-oro','1-basto','7-oro'],['5-oro','2-copa','6-copa'],['3-copa','1-espada','7-espada'],['4-copa','2-basto','6-basto'],['5-copa','1-copa','7-copa']],winner:1,leaders:[1,3]},
];
for (const fixture of fixtures) {
 const count=fixture.hands.length;
 const {room}=await asUser(host,()=>rpc('mazo_create_room',['P0',count]));
 for (let seat=1;seat<count;seat++) await asUser(users[seat],()=>rpc('mazo_join_room',[room.code,`P${seat}`]));
 await asUser(host,()=>rpc('mazo_deal',[room.code,false,1]));
 let state=await asUser(host,()=>rpc('mazo_room_state',[room.code]));
 assert.equal(state.room.play.turn,1);
 for (let seat=0;seat<count;seat++) {
  const cards=fixture.hands[seat].map(id=>({id,value:Number(id.split('-')[0]),suit:id.split('-')[1]}));
  await db.query('update public.hands set cards=$1::jsonb where room_id=$2 and player_id=$3',[JSON.stringify(cards),room.id,state.players[seat].id]);
 }
 await asUser(host,()=>assert.rejects(rpc('mazo_play_card',[room.code,fixture.hands[0][0],1,0]),/turno/));
 await asUser(guest,()=>assert.rejects(rpc('mazo_play_card',[room.code,fixture.hands[0][0],1,0]),/disponible/));
 await asUser(guest,()=>assert.rejects(rpc('mazo_play_card',[room.code,fixture.hands[1][0],2,0]),/cambió/));
 for (let n=0;n<3*count;n++) {
  state=await asUser(host,()=>rpc('mazo_room_state',[room.code]));
  const play=state.room.play;
  if (play.turn===null) break;
  const seat=play.turn;
  const cardId=fixture.hands[seat][play.trick];
  if (play.trick>0) await asUser(users[seat],()=>assert.rejects(rpc('mazo_play_card',[room.code,fixture.hands[seat][0],1,play.version]),/disponible/));
  await asUser(users[seat],()=>rpc('mazo_play_card',[room.code,cardId,1,play.version]));
  await asUser(users[seat],()=>assert.rejects(rpc('mazo_play_card',[room.code,cardId,1,play.version]),/cambió|terminó/));
  const own=await asUser(users[seat],()=>rpc('mazo_room_state',[room.code]));
  assert.equal(own.myHand.length,2-play.trick);
  assert.equal(own.myHand.some(c=>c.id===cardId),false);
  assert.equal(own.room.play.cards.length,n+1);
 }
 state=await asUser(host,()=>rpc('mazo_room_state',[room.code]));
 assert.equal(state.room.play.winner,fixture.winner);
 assert.deepEqual(state.room.play.results.map(r=>r.leader),fixture.leaders);
 assert.equal(state.room.play.turn,null);
 await asUser(host,()=>assert.rejects(rpc('mazo_play_card',[room.code,fixture.hands[0][2],1,state.room.play.version]),/terminó/));
 await asUser(host,()=>rpc('mazo_deal',[room.code,true,1]));
 state=await asUser(host,()=>rpc('mazo_room_state',[room.code]));
 assert.equal(state.room.play.mano,2%count); assert.equal(state.room.play.turn,2%count);
 assert.equal(state.room.play.cards.length,0); assert.equal(state.myHand.length,3);
 await asUser(host,()=>rpc('mazo_leave_room',[room.code]));
}
await db.exec('set role anon');
await assert.rejects(rpc('mazo_play_card',['XXXX','1-espada',1,0]),/permission denied/);
await db.exec('reset role');
for (const table of ['rooms','players','hands']) assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n,0);
console.log('SQL checks passed: private hands, turn enforcement, stale/repeated cards, pardas, team ties, Gallo, 2/3/4/6 seats, mano rotation and cleanup.');
await db.close();
