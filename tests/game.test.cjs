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

function service(remote = false, rpc = async () => { throw new Error('Backend unavailable'); }) {
  const store = new Map();
  const localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
  return load('services/gameService.ts', (path) => {
    if (path.includes('deck')) return deck;
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
