// ============================================================
// WNI Simulator - Authoritative game engine (pure functions).
// The server owns GameState; clients only send intents.
// ============================================================
import {
  AVATARS,
  BOARD,
  BOARD_SIZE,
  CARD_BY_ID,
  MUSIBAH_CARDS,
  TAKDIR_CARDS,
  SALARY,
  STARTING_MONEY,
  type Card,
  type GameState,
  type LogEntry,
  type PropertyState,
  type PropertyTile,
  type Player,
  type Tile,
} from '@wni/shared';

const PLAYER_COLORS = [
  '#e53935',
  '#1e88e5',
  '#43a047',
  '#fdd835',
  '#8e24aa',
  '#fb8c00',
];

let logSeq = 0;

function makeLog(text: string): LogEntry {
  return { id: `l${Date.now()}-${logSeq++}`, ts: Date.now(), text };
}

export function log(state: GameState, text: string): void {
  state.log.push(makeLog(text));
  if (state.log.length > 200) state.log.shift();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function jailIndex(): number {
  return BOARD.findIndex((t) => t.type === 'jail');
}

export function getTile(index: number): Tile {
  return BOARD[index];
}

// ---------------------------------------------------------------
// Lobby / setup
// ---------------------------------------------------------------

export function createInitialState(roomCode: string): GameState {
  return {
    roomCode,
    phase: 'lobby',
    players: [],
    currentPlayerIndex: 0,
    turnStage: 'awaiting-roll',
    lastDice: null,
    doublesCount: 0,
    properties: BOARD.filter((t): t is PropertyTile => t.type === 'property').map(
      (t) => ({ tileIndex: t.index, ownerId: null, houses: 0, mortgaged: false }),
    ),
    musibahQueue: shuffle(MUSIBAH_CARDS.map((c) => c.id)),
    takdirQueue: shuffle(TAKDIR_CARDS.map((c) => c.id)),
    pot: 0,
    log: [makeLog('Room dibuat. Menunggu pemain bergabung...')],
    winnerId: null,
  };
}

export function addPlayer(
  state: GameState,
  id: string,
  name: string,
  avatar?: string,
): Player | null {
  if (state.phase !== 'lobby') return null;
  if (state.players.length >= 6) return null;
  const player: Player = {
    id,
    name,
    color: PLAYER_COLORS[state.players.length % PLAYER_COLORS.length],
    avatar: avatar && AVATARS.includes(avatar) ? avatar : AVATARS[state.players.length % AVATARS.length],
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
    isHost: state.players.length === 0,
    connected: true,
  };
  state.players.push(player);
  log(state, `${name} bergabung ke permainan.`);
  return player;
}

export function startGame(state: GameState, byId: string): string | null {
  const host = state.players.find((p) => p.id === byId);
  if (!host?.isHost) return 'Hanya host yang bisa memulai permainan.';
  if (state.phase !== 'lobby') return 'Permainan sudah dimulai.';
  if (state.players.length < 2) return 'Butuh minimal 2 pemain.';
  state.phase = 'playing';
  state.currentPlayerIndex = 0;
  state.turnStage = 'awaiting-roll';
  log(state, 'Permainan dimulai! Giliran ' + state.players[0].name + '.');
  return null;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

export function propertyAt(
  state: GameState,
  tileIndex: number,
): PropertyState | undefined {
  return state.properties.find((p) => p.tileIndex === tileIndex);
}

function totalNetWorth(state: GameState, player: Player): number {
  let worth = player.money;
  for (const prop of state.properties) {
    if (prop.ownerId !== player.id) continue;
    const tile = BOARD[prop.tileIndex] as PropertyTile;
    worth += tile.price + prop.houses * tile.houseCost;
  }
  return worth;
}

function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.bankrupt);
}

/** Transfer money; if payer can't afford it, they go bankrupt. */
function transfer(
  state: GameState,
  fromId: string | null,
  toId: string | null,
  amount: number,
): void {
  if (amount <= 0) return;
  const from = fromId ? state.players.find((p) => p.id === fromId) ?? null : null;
  const to = toId ? state.players.find((p) => p.id === toId) ?? null : null;
  if (from) {
    from.money -= amount;
    if (from.money < 0) {
      // bangkrut
      handleBankruptcy(state, from, to);
      return;
    }
  }
  if (to) to.money += amount;
}

function handleBankruptcy(
  state: GameState,
  player: Player,
  creditor: Player | null,
): void {
  log(state, `${player.name} BANGKRUT!`);
  player.bankrupt = true;
  player.money = 0;
  // properti dikembalikan ke pasar (atau ke kreditur jika ada)
  for (const prop of state.properties) {
    if (prop.ownerId === player.id) {
      prop.ownerId = creditor ? creditor.id : null;
      prop.houses = 0;
      prop.mortgaged = false;
    }
  }
  checkWinCondition(state);
}

export function checkWinCondition(state: GameState): void {
  const alive = activePlayers(state);
  if (state.phase === 'playing' && alive.length === 1) {
    state.phase = 'finished';
    state.winnerId = alive[0].id;
    log(state, `🎉 ${alive[0].name} MENANG! Jadi WNI tersukses!`);
  }
}

// ---------------------------------------------------------------
// Rolling & movement
// ---------------------------------------------------------------

export interface RollResult {
  dice: [number, number];
  drewCard?: { deck: 'musibah' | 'takdir'; card: Card };
}

export function rollDice(
  state: GameState,
  playerId: string,
): { error?: string; result?: RollResult } {
  if (state.phase !== 'playing') return { error: 'Permainan belum berjalan.' };
  const player = currentPlayer(state);
  if (player.id !== playerId) return { error: 'Bukan giliran kamu.' };
  if (state.turnStage !== 'awaiting-roll')
    return { error: 'Kamu sudah melempar dadu.' };

  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  state.lastDice = [d1, d2];
  const isDouble = d1 === d2;

  // --- Penjara ---
  if (player.inJail) {
    log(state, `${player.name} melempar dadu di penjara: ${d1} & ${d2}.`);
    if (isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      log(state, `${player.name} lempar dadu kembar & bebas dari penjara!`);
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        // wajib bayar jaminan Rp 1.000.000 lalu keluar
        player.inJail = false;
        player.jailTurns = 0;
        transfer(state, player.id, null, 1_000_000);
        log(
          state,
          `${player.name} sudah 3 giliran di penjara, bayar jaminan Rp 1.000.000 dan keluar.`,
        );
      } else {
        log(state, `${player.name} gagal keluar penjara (giliran ${player.jailTurns}/3).`);
        state.turnStage = 'resolved';
        return { result: { dice: [d1, d2] } };
      }
    }
  }

  // Doubles tracking (di luar penjara)
  if (isDouble && !player.inJail) {
    state.doublesCount += 1;
    if (state.doublesCount >= 3) {
      log(state, `${player.name} lempar dadu kembar 3x berturut-turut — langsung ke penjara!`);
      sendToJail(state, player);
      state.doublesCount = 0;
      state.turnStage = 'resolved';
      return { result: { dice: [d1, d2] } };
    }
  } else {
    state.doublesCount = 0;
  }

  const steps = d1 + d2;
  const drew = movePlayer(state, player, steps, true);
  // dadu kembar -> boleh jalan lagi (stage tetap awaiting-roll setelah action selesai)
  return { result: { dice: [d1, d2], drewCard: drew ?? undefined } };
}

export function sendToJail(state: GameState, player: Player): void {
  player.position = jailIndex();
  player.inJail = true;
  player.jailTurns = 0;
  // 50% kekayaan disita negara (tema korupsi)
  const seized = Math.floor(player.money * 0.5);
  player.money -= seized;
  state.pot += seized;
  log(
    state,
    `${player.name} ketahuan korupsi! 50% kekayaan (Rp ${seized.toLocaleString('id-ID')}) disita negara & masuk penjara.`,
  );
}

/**
 * Move player by `steps` and resolve the tile they land on.
 * Returns a drawn card if the tile was a card tile.
 */
function movePlayer(
  state: GameState,
  player: Player,
  steps: number,
  collectSalary: boolean,
):
  | { deck: 'musibah' | 'takdir'; card: Card }
  | null {
  const prev = player.position;
  let next = (prev + steps) % BOARD_SIZE;
  if (next < 0) next += BOARD_SIZE;
  // lewat / mendarat di START
  if (collectSalary && steps > 0 && next <= prev) {
    player.money += SALARY;
    log(state, `${player.name} lewat START, terima gaji Rp ${SALARY.toLocaleString('id-ID')}.`);
  }
  player.position = next;
  const tile = BOARD[next];
  log(state, `${player.name} berhenti di ${tile.name}.`);
  return resolveTile(state, player, tile);
}

// ---------------------------------------------------------------
// Tile resolution
// ---------------------------------------------------------------

function resolveTile(
  state: GameState,
  player: Player,
  tile: Tile,
): { deck: 'musibah' | 'takdir'; card: Card } | null {
  state.turnStage = 'awaiting-action';
  switch (tile.type) {
    case 'start':
    case 'free':
      return null;
    case 'tax': {
      const amount = tile.amount ?? 0;
      transfer(state, player.id, null, amount);
      state.pot += amount;
      log(state, `${player.name} bayar ${tile.name} Rp ${amount.toLocaleString('id-ID')}.`);
      return null;
    }
    case 'goto-jail': {
      sendToJail(state, player);
      state.turnStage = 'resolved';
      return null;
    }
    case 'jail':
      // hanya mampir, tidak terjadi apa-apa
      return null;
    case 'musibah':
      return drawCard(state, player, 'musibah');
    case 'takdir':
      return drawCard(state, player, 'takdir');
    case 'property':
      resolveProperty(state, player, tile);
      return null;
  }
}

function resolveProperty(
  state: GameState,
  player: Player,
  tile: PropertyTile,
): void {
  const prop = propertyAt(state, tile.index)!;
  if (prop.ownerId === null) {
    // bisa dibeli: biarkan pemain memutuskan via turn:buy
    log(state, `${tile.name} belum dimiliki (harga Rp ${tile.price.toLocaleString('id-ID')}).`);
    return;
  }
  if (prop.ownerId === player.id) {
    log(state, `${tile.name} adalah milikmu sendiri.`);
    return;
  }
  // bayar sewa
  const owner = state.players.find((p) => p.id === prop.ownerId)!;
  const rent = prop.mortgaged ? 0 : tile.rent[prop.houses];
  if (rent <= 0) return;

  // ATURAN KORUPSI: jika pemilik sedang di penjara, sewa dibayar ke NEGARA.
  if (owner.inJail) {
    transfer(state, player.id, null, rent);
    state.pot += rent;
    log(
      state,
      `${player.name} bayar sewa ${tile.name} Rp ${rent.toLocaleString('id-ID')} — tapi ${owner.name} sedang di penjara, jadi uang masuk ke NEGARA.`,
    );
  } else {
    transfer(state, player.id, owner.id, rent);
    log(
      state,
      `${player.name} bayar sewa ${tile.name} Rp ${rent.toLocaleString('id-ID')} ke ${owner.name}.`,
    );
  }
}

// ---------------------------------------------------------------
// Buying & building
// ---------------------------------------------------------------

export function buyProperty(
  state: GameState,
  playerId: string,
): string | null {
  const player = currentPlayer(state);
  if (player.id !== playerId) return 'Bukan giliran kamu.';
  const tile = BOARD[player.position];
  if (tile.type !== 'property') return 'Petak ini bukan properti.';
  const prop = propertyAt(state, tile.index)!;
  if (prop.ownerId !== null) return 'Properti sudah dimiliki.';
  if (player.money < tile.price) return 'Uangmu tidak cukup.';
  player.money -= tile.price;
  prop.ownerId = player.id;
  log(
    state,
    `${player.name} membeli ${tile.name} seharga Rp ${tile.price.toLocaleString('id-ID')}.`,
  );
  return null;
}

/** Build a house/hotel; requires owning ALL properties in the island group. */
export function buildHouse(
  state: GameState,
  playerId: string,
  tileIndex: number,
): string | null {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 'Pemain tidak ditemukan.';
  if (currentPlayer(state).id !== playerId) return 'Bukan giliran kamu.';
  const tile = BOARD[tileIndex];
  if (tile.type !== 'property') return 'Petak ini bukan properti.';
  const prop = propertyAt(state, tileIndex)!;
  if (prop.ownerId !== playerId) return 'Kamu tidak memiliki properti ini.';
  if (prop.houses >= 5) return 'Sudah hotel, tidak bisa dibangun lagi.';

  // harus menguasai seluruh pulau
  const group = BOARD.filter(
    (t): t is PropertyTile => t.type === 'property' && t.island === tile.island,
  );
  const ownsAll = group.every(
    (t) => propertyAt(state, t.index)!.ownerId === playerId,
  );
  if (!ownsAll)
    return `Kamu harus menguasai semua kota di ${tile.island} dulu.`;

  if (player.money < tile.houseCost) return 'Uangmu tidak cukup membangun.';
  player.money -= tile.houseCost;
  prop.houses += 1;
  const what = prop.houses === 5 ? 'hotel' : `rumah ke-${prop.houses}`;
  log(state, `${player.name} membangun ${what} di ${tile.name}.`);
  return null;
}

// ---------------------------------------------------------------
// Cards
// ---------------------------------------------------------------

function drawFromQueue(state: GameState, deck: 'musibah' | 'takdir'): Card {
  const queue = deck === 'musibah' ? state.musibahQueue : state.takdirQueue;
  const source = deck === 'musibah' ? MUSIBAH_CARDS : TAKDIR_CARDS;
  if (queue.length === 0) {
    // reshuffle
    const refreshed = shuffle(source.map((c) => c.id));
    if (deck === 'musibah') state.musibahQueue = refreshed;
    else state.takdirQueue = refreshed;
  }
  const id = (deck === 'musibah' ? state.musibahQueue : state.takdirQueue).shift()!;
  return CARD_BY_ID[id];
}

function drawCard(
  state: GameState,
  player: Player,
  deck: 'musibah' | 'takdir',
): { deck: 'musibah' | 'takdir'; card: Card } {
  const card = drawFromQueue(state, deck);
  log(state, `${player.name} menarik Kartu ${deck === 'musibah' ? 'Musibah' : 'Takdir'}: "${card.text}"`);
  applyCard(state, player, card);
  return { deck, card };
}

function applyCard(state: GameState, player: Player, card: Card): void {
  const e = card.effect;
  switch (e.kind) {
    case 'money': {
      if (e.amount >= 0) {
        player.money += e.amount;
      } else {
        transfer(state, player.id, null, -e.amount);
        state.pot += -e.amount;
      }
      break;
    }
    case 'pay-each-player': {
      for (const other of activePlayers(state)) {
        if (other.id === player.id) continue;
        transfer(state, player.id, other.id, e.amount);
      }
      break;
    }
    case 'collect-each-player': {
      for (const other of activePlayers(state)) {
        if (other.id === player.id) continue;
        transfer(state, other.id, player.id, e.amount);
      }
      break;
    }
    case 'move-to': {
      const steps =
        (e.tileIndex - player.position + BOARD_SIZE) % BOARD_SIZE;
      movePlayer(state, player, steps === 0 ? BOARD_SIZE : steps, !!e.collectIfPass);
      break;
    }
    case 'move-by': {
      movePlayer(state, player, e.steps, true);
      break;
    }
    case 'go-to-jail': {
      sendToJail(state, player);
      state.turnStage = 'resolved';
      break;
    }
    case 'get-out-of-jail': {
      player.getOutOfJailCards += 1;
      break;
    }
    case 'drag-random-player-to-jail': {
      sendToJail(state, player);
      const others = activePlayers(state).filter((p) => p.id !== player.id && !p.inJail);
      if (others.length > 0) {
        const victim = others[Math.floor(Math.random() * others.length)];
        sendToJail(state, victim);
        log(state, `${player.name} menyeret ${victim.name} ikut masuk penjara!`);
      }
      state.turnStage = 'resolved';
      break;
    }
  }
}

// ---------------------------------------------------------------
// Jail actions & turn flow
// ---------------------------------------------------------------

export function payJail(state: GameState, playerId: string): string | null {
  const player = currentPlayer(state);
  if (player.id !== playerId) return 'Bukan giliran kamu.';
  if (!player.inJail) return 'Kamu tidak sedang di penjara.';
  if (state.turnStage !== 'awaiting-roll')
    return 'Hanya bisa bayar jaminan di awal giliran.';
  if (player.money < 1_000_000) return 'Uangmu tidak cukup untuk jaminan.';
  transfer(state, player.id, null, 1_000_000);
  state.pot += 1_000_000;
  player.inJail = false;
  player.jailTurns = 0;
  log(state, `${player.name} bayar jaminan Rp 1.000.000 dan keluar penjara. Silakan lempar dadu.`);
  return null;
}

export function useJailCard(state: GameState, playerId: string): string | null {
  const player = currentPlayer(state);
  if (player.id !== playerId) return 'Bukan giliran kamu.';
  if (!player.inJail) return 'Kamu tidak sedang di penjara.';
  if (player.getOutOfJailCards <= 0) return 'Kamu tidak punya kartu bebas penjara.';
  player.getOutOfJailCards -= 1;
  player.inJail = false;
  player.jailTurns = 0;
  log(state, `${player.name} memakai kartu "Bebas dari Penjara". Silakan lempar dadu.`);
  return null;
}

export function endTurn(state: GameState, playerId: string): string | null {
  const player = currentPlayer(state);
  if (player.id !== playerId) return 'Bukan giliran kamu.';
  if (state.phase !== 'playing') return 'Permainan belum berjalan.';

  // dadu kembar & tidak di penjara & belum resolved -> jalan lagi
  const rolledDouble =
    state.lastDice && state.lastDice[0] === state.lastDice[1];
  if (
    rolledDouble &&
    !player.inJail &&
    state.turnStage !== 'resolved' &&
    state.doublesCount > 0
  ) {
    state.turnStage = 'awaiting-roll';
    log(state, `${player.name} dapat giliran lagi (dadu kembar).`);
    return null;
  }

  advanceToNextPlayer(state);
  return null;
}

function advanceToNextPlayer(state: GameState): void {
  state.doublesCount = 0;
  state.lastDice = null;
  let guard = 0;
  do {
    state.currentPlayerIndex =
      (state.currentPlayerIndex + 1) % state.players.length;
    guard++;
  } while (state.players[state.currentPlayerIndex].bankrupt && guard <= state.players.length);
  state.turnStage = 'awaiting-roll';
  const next = currentPlayer(state);
  log(state, `Giliran ${next.name}.`);
  checkWinCondition(state);
}
