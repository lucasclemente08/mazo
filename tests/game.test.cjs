const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function load(relative, requireModule, context = {}) {
  const code = ts.transpileModule(readFileSync(`${__dirname}/../src/${relative}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: requireModule, console, crypto: webcrypto, ...context });
  return exports;
}
const deck = load('utils/deck.ts', () => { throw new Error('Unexpected import'); });
const truco = load('utils/truco.ts', () => { throw new Error('Unexpected import'); });

test('Truco ranking covers all 40 cards and resolves every parda combination', () => {
  const cards = deck.createSpanishDeck();
  assert.equal(truco.cardRank(cards.find(c => c.id === '1-espada')), 14);
  assert.equal(truco.cardRank(cards.find(c => c.id === '1-basto')), 13);
  assert.equal(truco.cardRank(cards.find(c => c.id === '7-espada')), 12);
  assert.equal(truco.cardRank(cards.find(c => c.id === '7-oro')), 11);
  for (const value of [3,2,12,11,10,6,5,4]) {
    assert.equal(new Set(cards.filter(c => c.value === value).map(truco.cardRank)).size,1);
  }
  for (const [results, expected] of [
    [[0,0],0], [[1,1],1], [[0,null],0], [[1,null],1], [[null,0],0], [[null,1],1],
    [[null,null,0],0], [[null,null,1],1], [[null,null,null],1],
    [[0,1,0],0], [[0,1,1],1], [[0,1,null],0], [[1,0,0],0], [[1,0,1],1], [[1,0,null],1],
  ]) {
    const room = { maxPlayers:2, dealerPosition:0 };
    let state = truco.initialPlay(room);
    for (const outcome of results) {
      const cardsBySeat = outcome === null ? ['3-oro','3-copa'] : outcome === 0 ? ['3-oro','4-copa'] : ['4-oro','3-copa'];
      for (let n=0;n<2;n++) {
        const position = state.turn;
        state = truco.advancePlay(room,state,{ card:cards.find(c=>c.id===cardsBySeat[position]), position, playerId:String(position), trick:state.trick });
      }
    }
    assert.equal(state.winner,expected,JSON.stringify(results));
    assert.equal(state.turn,null);
  }
});

test('Local play blocks out-of-turn, foreign, stale and repeated cards; reset rotates mano', async () => {
  const game=service();
  const host=await game.GameService.createRoom('Host',2);
  game.clearLocalSession();
  const guest=await game.GameService.joinRoom(host.room.code,'Guest');
  const session=p=>game.saveLocalSession({roomCode:host.room.code,playerId:p.id,playerName:p.name});
  session(host.player); await game.GameService.dealCards(host.room.code);
  let h=await game.GameService.getRoomState(host.room.code,host.player.id);
  let g=await game.GameService.getRoomState(host.room.code,guest.player.id);
  assert.equal(h.room.play.turn,1);
  await assert.rejects(game.GameService.playCard(host.room.code,h.myHand[0].id,1,0),/turno/);
  session(guest.player);
  await assert.rejects(game.GameService.playCard(host.room.code,h.myHand[0].id,1,0),/disponible/);
  const chosen=g.myHand[0].id;
  await game.GameService.playCard(host.room.code,chosen,1,0);
  g=await game.GameService.getRoomState(host.room.code,guest.player.id);
  assert.equal(g.myHand.length,2); assert.equal(g.room.play.cards[0].card.id,chosen);
  session(host.player);
  await assert.rejects(game.GameService.playCard(host.room.code,h.myHand[0].id,1,0),/cambió/);
  await game.GameService.playCard(host.room.code,h.myHand[0].id,1,1);
  while ((h=await game.GameService.getRoomState(host.room.code,host.player.id)).room.play.turn !== null) {
    const p=h.room.play.turn===0?host.player:guest.player; session(p);
    const state=await game.GameService.getRoomState(host.room.code,p.id);
    if (p.id===guest.player.id) await assert.rejects(game.GameService.playCard(host.room.code,chosen,1,state.room.play.version),/disponible/);
    await game.GameService.playCard(host.room.code,state.myHand[0].id,1,state.room.play.version);
  }
  await assert.rejects(game.GameService.playCard(host.room.code,chosen,1,h.room.play.version),/terminó/);
  session(host.player); await game.GameService.newRound(host.room.code,1);
  h=await game.GameService.getRoomState(host.room.code,host.player.id);
  assert.equal(h.room.play.mano,0); assert.equal(h.room.play.cards.length,0); assert.equal(h.myHand.length,3);
});

function service(remote = false, rpc = async () => { throw new Error('Backend unavailable'); }) {
  const store = new Map();
  const localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
  return load('services/gameService.ts', (path) => {
    if (path.includes('deck')) return deck;
    if (path.includes('truco')) return truco;
    if (path === './supabase') return { isSupabaseConfigured: remote };
    if (path === './remoteGame') return { gameRpc: rpc };
    throw new Error(`Unexpected import ${path}`);
  }, { localStorage, window: { dispatchEvent() {} }, CustomEvent: class {} });
}

test('Spanish deck and deal have unique cards, preserve input, and reject invalid counts', () => {
  const cards = deck.createSpanishDeck();
  assert.equal(cards.length, 40);
  assert.equal(new Set(cards.map((card) => card.id)).size, 40);
  const original = cards.map((card) => card.id).join(',');
  const shuffled = deck.shuffleDeck(cards);
  assert.equal(cards.map((card) => card.id).join(','), original);
  for (const count of [2, 4, 6]) {
    const hands = deck.dealCards(shuffled, count);
    assert.ok(hands.every((hand) => hand.length === 3));
    assert.equal(new Set(hands.flat().map((card) => card.id)).size, count * 3);
  }
  for (const count of [0, -1, 1.5, 14]) assert.throws(() => deck.dealCards(cards, count));
});

test('Local room validates capacity, identity, permissions and round transitions', async () => {
  const game = service();
  await assert.rejects(game.GameService.createRoom(' '), /nombre/);
  const { room, player: host } = await game.GameService.createRoom('Host', 4);
  await assert.rejects(game.GameService.dealCards(room.code), /complete/);
  game.clearLocalSession();
  await assert.rejects(game.GameService.joinRoom(room.code, 'Host'), /nombre/);
  const guest = await game.GameService.joinRoom(room.code, 'Guest');
  const rejoined = await game.GameService.joinRoom(room.code, 'Guest');
  assert.equal(rejoined.player.id, guest.player.id);
  game.clearLocalSession();
  await game.GameService.joinRoom(room.code, 'Third');
  game.clearLocalSession();
  await game.GameService.joinRoom(room.code, 'Fourth');
  await assert.rejects(game.GameService.dealCards(room.code), /anfitrión/);
  game.clearLocalSession();
  await assert.rejects(game.GameService.joinRoom(room.code, 'Fifth'), /completa/);
  game.saveLocalSession({ roomCode: room.code, playerId: host.id, playerName: host.name });
  await assert.rejects(game.GameService.newRound(room.code), /primera/);
  await game.GameService.dealCards(room.code);
  await assert.rejects(game.GameService.dealCards(room.code), /comenzó/);
  const state = await game.GameService.getRoomState(room.code, host.id);
  assert.equal(state.myHand.length, 3);
  await game.GameService.newRound(room.code);
  const next = await game.GameService.getRoomState(room.code, host.id);
  assert.equal(next.room.roundNumber, 2);
  assert.equal(next.room.dealerPosition, 1);
  game.clearLocalSession();
  await assert.rejects(game.GameService.joinRoom(room.code, 'Late'), /comenzó/);
});

test('Configured backend failures propagate without a local fallback', async () => {
  const game = service(true);
  await assert.rejects(game.GameService.createRoom('Host', 2), /Backend unavailable/);
  assert.equal(game.getLocalSession(), null);
  await assert.rejects(game.GameService.joinRoom('ABCD', 'Guest'), /Backend unavailable/);
});

test('Scoreboard validates host, version, target, corrections and stops a completed match', async () => {
  const game = service();
  const { room, player } = await game.GameService.createRoom('Host', 2);
  await game.GameService.updateScore(room.code, 0, 0, 0, 15);
  await assert.rejects(game.GameService.updateScore(room.code, 0, 1, 0), /marcador cambió/);
  await assert.rejects(game.GameService.updateScore(room.code, 0, -1, 1), /negativo/);
  await game.GameService.updateScore(room.code, 0, 14, 1);
  game.clearLocalSession();
  await game.GameService.joinRoom(room.code, 'Guest');
  await assert.rejects(game.GameService.updateScore(room.code, 1, 1, 2), /anfitrión/);
  game.saveLocalSession({ roomCode: room.code, playerId: player.id, playerName: player.name });
  await game.GameService.dealCards(room.code);
  await game.GameService.newRound(room.code);
  assert.equal((await game.GameService.getRoomState(room.code, player.id)).room.scores[0], 14);
  await game.GameService.updateScore(room.code, 0, 4, 2);
  assert.equal((await game.GameService.getRoomState(room.code, player.id)).room.scores[0], 15);
  await assert.rejects(game.GameService.newRound(room.code), /terminó/);
  await assert.rejects(game.GameService.updateScore(room.code, 1, 1, 3), /terminó/);
  await game.GameService.updateScore(room.code, 0, -1, 3);
  await game.GameService.newRound(room.code);
  await game.GameService.leaveRoom(room.code);
  assert.equal(await game.GameService.getRoomState(room.code, player.id), null);
});

test('Remote actions send the expected round and store server identity', async () => {
  const calls = [];
  const game = service(true, async (name, args) => {
    calls.push({ name, args });
    return { room: { code: 'ABCD' }, player: { id: 'server-id', name: 'Host' } };
  });
  await game.GameService.createRoom('Host', 2);
  assert.equal(game.getLocalSession().playerId, 'server-id');
  await game.GameService.newRound('ABCD', 7);
  assert.equal(calls[1].args.expected_round, 7);
  assert.equal(calls[1].name, 'mazo_deal');
});
