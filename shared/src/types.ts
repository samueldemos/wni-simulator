// ============================================================
// WNI Simulator - Core type definitions
// Shared between server (authoritative game engine) and client.
// ============================================================

/** The five "pulau" (islands) act as property colour-groups. */
export type Island =
  | 'papua'
  | 'kalimantan'
  | 'sulawesi'
  | 'sumatera'
  | 'jawa';

export const ISLAND_ORDER: Island[] = [
  'papua',
  'kalimantan',
  'sulawesi',
  'sumatera',
  'jawa',
];

export const ISLAND_LABEL: Record<Island, string> = {
  papua: 'Papua',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  sumatera: 'Sumatera',
  jawa: 'Jawa',
};

/** Colour used to render each island group on the board. */
export const ISLAND_COLOR: Record<Island, string> = {
  papua: '#8d6e63', // brown  - cheapest
  kalimantan: '#43a047', // green
  sulawesi: '#1e88e5', // blue
  sumatera: '#fb8c00', // orange
  jawa: '#e53935', // red    - most expensive
};

export type TileType =
  | 'start' // GO - terima gaji
  | 'property' // kota yang bisa dibeli
  | 'musibah' // tarik Kartu Musibah
  | 'takdir' // tarik Kartu Takdir
  | 'tax' // bayar pajak ke negara
  | 'jail' // "Ketahuan Korupsi" (masuk penjara)
  | 'free' // bebas parkir (netral)
  | 'goto-jail'; // petak "Kamu Terciduk KPK" -> kirim ke penjara

export interface PropertyTile {
  index: number;
  type: 'property';
  name: string;
  island: Island;
  price: number;
  /** rent[0] = tanpa rumah, rent[1..4] = jumlah rumah, rent[5] = hotel */
  rent: [number, number, number, number, number, number];
  houseCost: number;
}

export interface SpecialTile {
  index: number;
  type: Exclude<TileType, 'property'>;
  name: string;
  /** amount for tax tiles */
  amount?: number;
}

export type Tile = PropertyTile | SpecialTile;

// ---------------------------------------------------------------
// Cards: Musibah (disaster) & Takdir (fate)
// ---------------------------------------------------------------

export type CardDeck = 'musibah' | 'takdir';

/**
 * A card's effect is described declaratively so the engine stays
 * authoritative and the client can render a readable description.
 */
export type CardEffect =
  // uang dari/ke bank (negara). amount positif = terima, negatif = bayar.
  | { kind: 'money'; amount: number }
  // bayar sejumlah uang ke SETIAP pemain lain (atau terima jika negatif)
  | { kind: 'pay-each-player'; amount: number }
  // terima sejumlah uang dari SETIAP pemain lain
  | { kind: 'collect-each-player'; amount: number }
  // pindah ke index petak tertentu (boleh lewat start untuk gaji)
  | { kind: 'move-to'; tileIndex: number; collectIfPass?: boolean }
  // maju / mundur sejumlah langkah
  | { kind: 'move-by'; steps: number }
  // langsung masuk penjara (korupsi)
  | { kind: 'go-to-jail' }
  // keluar penjara gratis (disimpan pemain)
  | { kind: 'get-out-of-jail' }
  // seret pemain lain yang dipilih acak ikut ke penjara
  | { kind: 'drag-random-player-to-jail' };

export interface Card {
  id: string;
  deck: CardDeck;
  text: string;
  effect: CardEffect;
}

// ---------------------------------------------------------------
// Players & game state
// ---------------------------------------------------------------

export interface Player {
  id: string; // socket/session id
  name: string;
  color: string;
  money: number;
  position: number; // tile index
  inJail: boolean;
  jailTurns: number; // berapa giliran sudah di penjara
  getOutOfJailCards: number;
  bankrupt: boolean;
  isHost: boolean;
  connected: boolean;
}

export interface PropertyState {
  tileIndex: number;
  ownerId: string | null;
  houses: number; // 0..4 rumah, 5 = hotel
  mortgaged: boolean;
}

export type GamePhase = 'lobby' | 'playing' | 'finished';

/** What the current player is allowed / expected to do right now. */
export type TurnStage =
  | 'awaiting-roll' // pemain harus lempar dadu
  | 'awaiting-action' // sudah gerak, boleh beli / akhiri giliran
  | 'resolved'; // menunggu giliran berpindah

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turnStage: TurnStage;
  lastDice: [number, number] | null;
  doublesCount: number;
  properties: PropertyState[];
  musibahQueue: string[]; // id kartu, diacak di awal
  takdirQueue: string[];
  pot: number; // uang "bebas parkir" yang terkumpul (opsional)
  log: LogEntry[];
  winnerId: string | null;
}

export interface LogEntry {
  id: string;
  ts: number;
  text: string;
}

// ---------------------------------------------------------------
// Socket.IO event protocol (client <-> server)
// ---------------------------------------------------------------

export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, cb: AckRoom) => void;
  'room:join': (payload: { roomCode: string; name: string }, cb: AckRoom) => void;
  'game:start': (cb: AckBasic) => void;
  'turn:roll': (cb: AckBasic) => void;
  'turn:buy': (cb: AckBasic) => void;
  'turn:build': (payload: { tileIndex: number }, cb: AckBasic) => void;
  'turn:end': (cb: AckBasic) => void;
  'jail:pay': (cb: AckBasic) => void;
  'jail:useCard': (cb: AckBasic) => void;
  'chat:send': (payload: { text: string }) => void;
}

export interface ServerToClientEvents {
  'state:update': (state: GameState) => void;
  'you:are': (payload: { playerId: string }) => void;
  'card:drawn': (payload: { deck: CardDeck; card: Card }) => void;
  'chat:message': (payload: { name: string; text: string; ts: number }) => void;
  'error:msg': (payload: { message: string }) => void;
}

export type AckBasic = (res: { ok: boolean; error?: string }) => void;
export type AckRoom = (res: {
  ok: boolean;
  error?: string;
  roomCode?: string;
  playerId?: string;
}) => void;

// Starting constants
export const STARTING_MONEY = 15_000_000; // Rp 15 juta
export const SALARY = 2_000_000; // gaji saat lewat START
export const JAIL_INDEX_FINDER = (tiles: Tile[]): number =>
  tiles.findIndex((t) => t.type === 'jail');
