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
  | 'tol' // Jalan Tol: bayar + bisa teleport ke tol lain
  | 'goto-jail'; // petak "Kamu Terciduk KPK" -> kirim ke penjara

/**
 * Level properti (3 tingkat):
 *   0 = Tanah Kosong (baru dibeli)
 *   1 = Rumah Subsidi
 *   2 = Rumah OKB (Orang Kaya Baru)
 */
export type PropertyLevel = 0 | 1 | 2;

export const LEVEL_LABEL: Record<PropertyLevel, string> = {
  0: 'Tanah Kosong',
  1: 'Rumah Subsidi',
  2: 'Rumah OKB',
};

export const LEVEL_ICON: Record<PropertyLevel, string> = {
  0: '🟫',
  1: '🏠',
  2: '🏯',
};

export interface PropertyTile {
  index: number;
  type: 'property';
  name: string;
  island: Island;
  price: number;
  /** sewa per level: [tanah kosong, rumah subsidi, rumah OKB] */
  rent: [number, number, number];
  /** biaya upgrade ke level berikutnya: [->subsidi, ->OKB] */
  upgradeCost: [number, number];
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
  | { kind: 'drag-random-player-to-jail' }
  // negara menyita SATU tanah kosong (level 0) milik pemain (acak), tanpa ganti rugi
  | { kind: 'seize-empty-land' };

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
  avatar: string; // emoji karakter
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
  level: PropertyLevel; // 0 tanah kosong, 1 subsidi, 2 OKB
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
  pot: number; // kas negara yang terkumpul
  log: LogEntry[];
  winnerId: string | null;
  /** pemain yang sedang HARUS memilih upgrade tanah (karena lewat START) */
  pendingUpgradeFor: string | null;
  /** pemain yang sedang DI petak Jalan Tol dan boleh teleport (opsional) */
  pendingTolFor: string | null;
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
  'room:create': (payload: { name: string; avatar?: string }, cb: AckRoom) => void;
  'room:join': (
    payload: { roomCode: string; name: string; avatar?: string },
    cb: AckRoom,
  ) => void;
  'game:start': (cb: AckBasic) => void;
  'turn:roll': (cb: AckBasic) => void;
  'turn:buy': (cb: AckBasic) => void;
  'turn:end': (cb: AckBasic) => void;
  // upgrade tanah (dipicu saat lewat START): pilih 1 properti untuk naik level
  'upgrade:choose': (payload: { tileIndex: number }, cb: AckBasic) => void;
  'upgrade:skip': (cb: AckBasic) => void;
  // Jalan Tol: teleport ke tol lain, atau lewati
  'tol:teleport': (payload: { tileIndex: number }, cb: AckBasic) => void;
  'tol:skip': (cb: AckBasic) => void;
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

// Avatar karakter khas WNI yang bisa dipilih pemain.
// label dipakai sebagai tooltip / nama karakter.
export interface AvatarOption {
  emoji: string;
  label: string;
}
export const AVATAR_OPTIONS: AvatarOption[] = [
  { emoji: '🧕', label: 'Emak-emak Arisan' },
  { emoji: '🛵', label: 'Driver Ojol' },
  { emoji: '👮', label: 'Oknum' },
  { emoji: '🕴️', label: 'Pejabat' },
  { emoji: '💂', label: 'Satpam Komplek' },
  { emoji: '🧑‍🌾', label: 'Petani' },
  { emoji: '👨‍🍳', label: 'Tukang Bakso' },
  { emoji: '🤵', label: 'Pak RT' },
  { emoji: '🧑‍🎤', label: 'Selebgram' },
  { emoji: '👩‍💼', label: 'Bos UMKM' },
  { emoji: '🧔', label: 'Preman Insaf' },
  { emoji: '😎', label: 'Sultan Mendadak' },
];
// list emoji saja (untuk kompatibilitas lama)
export const AVATARS = AVATAR_OPTIONS.map((a) => a.emoji);

// Starting constants
export const STARTING_MONEY = 15_000_000; // Rp 15 juta
export const SALARY = 2_000_000; // gaji saat lewat START
export const TOL_FEE = 500_000; // bayar saat berhenti di Jalan Tol
export const JAIL_INDEX_FINDER = (tiles: Tile[]): number =>
  tiles.findIndex((t) => t.type === 'jail');
