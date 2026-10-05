import type { Card, Tile } from './types.js';

// ============================================================
// Board layout - 28 petak (7 per sisi).
// Harga naik dari Papua (termurah) -> Jawa (termahal).
// rent = [polos, 1 rumah, 2, 3, 4, hotel]
// ============================================================

export const BOARD: Tile[] = [
  // --- Sisi bawah ---
  { index: 0, type: 'start', name: 'START (Terima Gaji)' },

  // PAPUA (termurah) - coklat
  {
    index: 1,
    type: 'property',
    name: 'Jayapura',
    island: 'papua',
    price: 600_000,
    rent: [20_000, 100_000, 300_000, 900_000, 1_600_000, 2_500_000],
    houseCost: 500_000,
  },
  { index: 2, type: 'musibah', name: 'Kartu Musibah' },
  {
    index: 3,
    type: 'property',
    name: 'Raja Ampat',
    island: 'papua',
    price: 800_000,
    rent: [40_000, 200_000, 600_000, 1_800_000, 3_200_000, 4_500_000],
    houseCost: 500_000,
  },
  { index: 4, type: 'tax', name: 'Pajak Penghasilan', amount: 1_000_000 },
  {
    index: 5,
    type: 'property',
    name: 'Wamena',
    island: 'papua',
    price: 1_000_000,
    rent: [60_000, 300_000, 900_000, 2_700_000, 4_000_000, 5_500_000],
    houseCost: 500_000,
  },

  // --- Pojok: Penjara (hanya "mampir") ---
  { index: 6, type: 'jail', name: 'Penjara (Ketahuan Korupsi)' },

  // KALIMANTAN - hijau
  {
    index: 7,
    type: 'property',
    name: 'Pontianak',
    island: 'kalimantan',
    price: 1_200_000,
    rent: [80_000, 400_000, 1_000_000, 3_000_000, 4_500_000, 6_000_000],
    houseCost: 1_000_000,
  },
  { index: 8, type: 'takdir', name: 'Kartu Takdir' },
  {
    index: 9,
    type: 'property',
    name: 'Balikpapan',
    island: 'kalimantan',
    price: 1_400_000,
    rent: [100_000, 500_000, 1_500_000, 4_500_000, 6_250_000, 7_500_000],
    houseCost: 1_000_000,
  },
  {
    index: 10,
    type: 'property',
    name: 'Samarinda',
    island: 'kalimantan',
    price: 1_600_000,
    rent: [120_000, 600_000, 1_800_000, 5_000_000, 7_000_000, 9_000_000],
    houseCost: 1_000_000,
  },

  // --- Pojok: Bebas Parkir ---
  { index: 11, type: 'free', name: 'Bebas Parkir' },

  // SULAWESI - biru
  {
    index: 12,
    type: 'property',
    name: 'Makassar',
    island: 'sulawesi',
    price: 1_800_000,
    rent: [140_000, 700_000, 2_000_000, 5_500_000, 7_500_000, 9_500_000],
    houseCost: 1_500_000,
  },
  { index: 13, type: 'musibah', name: 'Kartu Musibah' },
  {
    index: 14,
    type: 'property',
    name: 'Manado',
    island: 'sulawesi',
    price: 2_000_000,
    rent: [160_000, 800_000, 2_200_000, 6_000_000, 8_000_000, 10_000_000],
    houseCost: 1_500_000,
  },
  { index: 15, type: 'tax', name: 'Pajak Kendaraan', amount: 1_500_000 },
  {
    index: 16,
    type: 'property',
    name: 'Palu',
    island: 'sulawesi',
    price: 2_200_000,
    rent: [180_000, 900_000, 2_500_000, 7_000_000, 8_750_000, 11_000_000],
    houseCost: 1_500_000,
  },

  // --- Pojok: Terciduk KPK -> ke penjara ---
  { index: 17, type: 'goto-jail', name: 'Terciduk KPK!' },

  // SUMATERA - oranye
  {
    index: 18,
    type: 'property',
    name: 'Palembang',
    island: 'sumatera',
    price: 2_400_000,
    rent: [200_000, 1_000_000, 3_000_000, 7_500_000, 9_250_000, 12_000_000],
    houseCost: 2_000_000,
  },
  { index: 19, type: 'takdir', name: 'Kartu Takdir' },
  {
    index: 20,
    type: 'property',
    name: 'Padang',
    island: 'sumatera',
    price: 2_600_000,
    rent: [220_000, 1_100_000, 3_300_000, 8_000_000, 9_750_000, 13_000_000],
    houseCost: 2_000_000,
  },
  {
    index: 21,
    type: 'property',
    name: 'Medan',
    island: 'sumatera',
    price: 2_800_000,
    rent: [240_000, 1_200_000, 3_600_000, 8_500_000, 10_250_000, 14_000_000],
    houseCost: 2_000_000,
  },

  // --- Pojok: Kartu Musibah besar ---
  { index: 22, type: 'musibah', name: 'Kartu Musibah' },

  // JAWA (termahal) - merah. Pusat peradaban!
  {
    index: 23,
    type: 'property',
    name: 'Surabaya',
    island: 'jawa',
    price: 3_200_000,
    rent: [280_000, 1_500_000, 4_500_000, 10_000_000, 12_000_000, 15_000_000],
    houseCost: 2_500_000,
  },
  { index: 24, type: 'takdir', name: 'Kartu Takdir' },
  {
    index: 25,
    type: 'property',
    name: 'Bandung',
    island: 'jawa',
    price: 3_600_000,
    rent: [320_000, 1_600_000, 4_800_000, 11_000_000, 13_000_000, 16_500_000],
    houseCost: 2_500_000,
  },
  { index: 26, type: 'tax', name: 'Pajak Barang Mewah', amount: 2_500_000 },
  {
    index: 27,
    type: 'property',
    name: 'Jakarta',
    island: 'jawa',
    price: 4_000_000,
    rent: [500_000, 2_000_000, 6_000_000, 14_000_000, 17_000_000, 20_000_000],
    houseCost: 2_500_000,
  },
];

export const BOARD_SIZE = BOARD.length; // 28

// ============================================================
// Kartu Musibah (disaster) - bisa menyeret pemain lain,
// tapi kadang justru menguntungkan pemain lain.
// ============================================================

export const MUSIBAH_CARDS: Card[] = [
  {
    id: 'm1',
    deck: 'musibah',
    text: 'Banjir melanda kotamu! Perbaikan menelan Rp 2.000.000.',
    effect: { kind: 'money', amount: -2_000_000 },
  },
  {
    id: 'm2',
    deck: 'musibah',
    text: 'Kamu ditangkap karena korupsi dana bansos. Masuk penjara!',
    effect: { kind: 'go-to-jail' },
  },
  {
    id: 'm3',
    deck: 'musibah',
    text: 'Kamu dan satu kolega korupsi ketahuan. Seret satu pemain lain ke penjara!',
    effect: { kind: 'drag-random-player-to-jail' },
  },
  {
    id: 'm4',
    deck: 'musibah',
    text: 'Gempa bumi! Setiap pemain lain membantu kamu Rp 500.000.',
    effect: { kind: 'collect-each-player', amount: 500_000 },
  },
  {
    id: 'm5',
    deck: 'musibah',
    text: 'Kamu kena tilang pak polisi. Bayar denda Rp 500.000.',
    effect: { kind: 'money', amount: -500_000 },
  },
  {
    id: 'm6',
    deck: 'musibah',
    text: 'Harga BBM naik! Kamu bayar Rp 300.000 ke setiap pemain lain (patungan ojek).',
    effect: { kind: 'pay-each-player', amount: 300_000 },
  },
  {
    id: 'm7',
    deck: 'musibah',
    text: 'Kebakaran pasar. Mundur 3 langkah untuk mengungsi.',
    effect: { kind: 'move-by', steps: -3 },
  },
  {
    id: 'm8',
    deck: 'musibah',
    text: 'Pandemi! Semua terdampak — kamu terima Rp 400.000 dari tiap pemain lain (bagi sembako terbalik).',
    effect: { kind: 'collect-each-player', amount: 400_000 },
  },
];

// ============================================================
// Kartu Takdir (fate) - bisa baik atau apes.
// ============================================================

export const TAKDIR_CARDS: Card[] = [
  {
    id: 't1',
    deck: 'takdir',
    text: 'Takdir baik! Kamu dapat warisan Rp 3.000.000.',
    effect: { kind: 'money', amount: 3_000_000 },
  },
  {
    id: 't2',
    deck: 'takdir',
    text: 'Kamu menang undian berhadiah Rp 1.500.000.',
    effect: { kind: 'money', amount: 1_500_000 },
  },
  {
    id: 't3',
    deck: 'takdir',
    text: 'Takdir apes: investasi bodong, uangmu raib Rp 2.000.000.',
    effect: { kind: 'money', amount: -2_000_000 },
  },
  {
    id: 't4',
    deck: 'takdir',
    text: 'Kamu dapat kartu "Bebas dari Penjara" (Surat Sakti). Simpan baik-baik.',
    effect: { kind: 'get-out-of-jail' },
  },
  {
    id: 't5',
    deck: 'takdir',
    text: 'Dapat THR dari kantor! Maju ke START dan terima gaji.',
    effect: { kind: 'move-to', tileIndex: 0, collectIfPass: true },
  },
  {
    id: 't6',
    deck: 'takdir',
    text: 'Panggilan dinas ke Jakarta. Langsung ke Jakarta (lewat START tetap dapat gaji).',
    effect: { kind: 'move-to', tileIndex: 27, collectIfPass: true },
  },
  {
    id: 't7',
    deck: 'takdir',
    text: 'Takdir baik: proyek pemerintah cair. Terima Rp 2.500.000.',
    effect: { kind: 'money', amount: 2_500_000 },
  },
  {
    id: 't8',
    deck: 'takdir',
    text: 'Takdir apes: ditipu arisan online. Bayar Rp 1.000.000.',
    effect: { kind: 'money', amount: -1_000_000 },
  },
];

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(
  [...MUSIBAH_CARDS, ...TAKDIR_CARDS].map((c) => [c.id, c]),
);
