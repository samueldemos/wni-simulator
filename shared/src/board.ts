import type { Card, Tile } from './types.js';

// ============================================================
// Board layout - 28 petak (7 per sisi).
// Harga naik dari Papua (termurah) -> Jawa (termahal).
// rent = [polos, 1 rumah, 2, 3, 4, hotel]
// ============================================================

export const BOARD: Tile[] = [
  // --- Sisi bawah ---
  { index: 0, type: 'start', name: 'START (Gajian!)' },

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
  { index: 4, type: 'tax', name: 'Pungli Oknum', amount: 1_000_000 },
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
  { index: 6, type: 'jail', name: 'Rutan KPK' },

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
  { index: 11, type: 'free', name: 'Warkop (Ngopi Dulu)' },

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
  { index: 15, type: 'tax', name: 'Jatah Preman', amount: 1_500_000 },
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
  { index: 17, type: 'goto-jail', name: 'OTT KPK!' },

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
  { index: 26, type: 'tax', name: 'Pajak Sultan', amount: 2_500_000 },
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
    text: 'Proyek fiktif "jalan tol antah berantah" ketahuan BPK. Kembalikan Rp 2.000.000 ke negara.',
    effect: { kind: 'money', amount: -2_000_000 },
  },
  {
    id: 'm2',
    deck: 'musibah',
    text: 'Dana bansos "nyangkut" di rekeningmu. OTT KPK! Langsung masuk Rutan.',
    effect: { kind: 'go-to-jail' },
  },
  {
    id: 'm3',
    deck: 'musibah',
    text: 'Kongkalikong tender ketahuan. Kamu nyanyi di persidangan & seret 1 kolega ikut masuk Rutan!',
    effect: { kind: 'drag-random-player-to-jail' },
  },
  {
    id: 'm4',
    deck: 'musibah',
    text: 'Konten "settingan bagi-bagi duit" viral. Tiap pemain lain nyawer kamu Rp 500.000.',
    effect: { kind: 'collect-each-player', amount: 500_000 },
  },
  {
    id: 'm5',
    deck: 'musibah',
    text: 'Ditilang padahal surat lengkap. "Damai di tempat" Rp 500.000.',
    effect: { kind: 'money', amount: -500_000 },
  },
  {
    id: 'm6',
    deck: 'musibah',
    text: 'BBM naik lagi. Kamu patungan subsidi ke rakyat: bayar Rp 300.000 ke tiap pemain lain.',
    effect: { kind: 'pay-each-player', amount: 300_000 },
  },
  {
    id: 'm7',
    deck: 'musibah',
    text: 'Macet 4 jam gara-gara pejabat lewat (jalan ditutup). Mundur 3 langkah.',
    effect: { kind: 'move-by', steps: -3 },
  },
  {
    id: 'm8',
    deck: 'musibah',
    text: 'Jadi korban arisan bodong emak-emak kompleks. Rugi Rp 1.500.000.',
    effect: { kind: 'money', amount: -1_500_000 },
  },
  {
    id: 'm9',
    deck: 'musibah',
    text: 'Keluarga minta "pinjam buat modal usaha". Tiap pemain lain nagih kamu Rp 400.000.',
    effect: { kind: 'pay-each-player', amount: 400_000 },
  },
  {
    id: 'm10',
    deck: 'musibah',
    text: 'Ketipu toko online, barang nggak dikirim, seller kabur. Melayang Rp 800.000.',
    effect: { kind: 'money', amount: -800_000 },
  },
  {
    id: 'm11',
    deck: 'musibah',
    text: 'Dipalak preman di parkiran. "Uang keamanan" Rp 600.000.',
    effect: { kind: 'money', amount: -600_000 },
  },
  {
    id: 'm12',
    deck: 'musibah',
    text: 'Flexing di medsos kebablasan, dipanggil pajak. Harta diperiksa, mundur 2 langkah.',
    effect: { kind: 'move-by', steps: -2 },
  },
  {
    id: 'm13',
    deck: 'musibah',
    text: 'Antre Pertalite 2 jam, eh pas giliran malah habis. Rugi waktu & bensin Rp 300.000.',
    effect: { kind: 'money', amount: -300_000 },
  },
  {
    id: 'm14',
    deck: 'musibah',
    text: 'Jadi "tumbal" di kantor pas ada masalah. Semua lempar tanggung jawab ke kamu: bayar Rp 350.000 tiap pemain lain.',
    effect: { kind: 'pay-each-player', amount: 350_000 },
  },
];

// ============================================================
// Kartu Takdir (fate) - bisa baik atau apes.
// ============================================================

export const TAKDIR_CARDS: Card[] = [
  {
    id: 't1',
    deck: 'takdir',
    text: 'Lolos CPNS "jalur orang dalam" berkat om pejabat. Terima Rp 3.000.000.',
    effect: { kind: 'money', amount: 3_000_000 },
  },
  {
    id: 't2',
    deck: 'takdir',
    text: 'Menang giveaway sultan medsos (yang penting follow & tag 3 teman). Dapat Rp 1.500.000.',
    effect: { kind: 'money', amount: 1_500_000 },
  },
  {
    id: 't3',
    deck: 'takdir',
    text: 'FOMO ikut investasi crypto "pasti cuan" dari influencer. Raib Rp 2.000.000.',
    effect: { kind: 'money', amount: -2_000_000 },
  },
  {
    id: 't4',
    deck: 'takdir',
    text: 'Dapat "Surat Sakti" dari backing pejabat. Simpan untuk bebas dari Rutan KPK sekali.',
    effect: { kind: 'get-out-of-jail' },
  },
  {
    id: 't5',
    deck: 'takdir',
    text: 'THR cair! Tapi dipanggil pulang kampung. Maju ke START dan terima gajian.',
    effect: { kind: 'move-to', tileIndex: 0, collectIfPass: true },
  },
  {
    id: 't6',
    deck: 'takdir',
    text: 'Dipanggil "rapat" ke Senayan Jakarta (modus studi banding). Melaju ke Jakarta.',
    effect: { kind: 'move-to', tileIndex: 27, collectIfPass: true },
  },
  {
    id: 't7',
    deck: 'takdir',
    text: 'Fee proyek "siluman" cair ke rekening pribadi. Terima Rp 2.500.000. (semoga aman)',
    effect: { kind: 'money', amount: 2_500_000 },
  },
  {
    id: 't8',
    deck: 'takdir',
    text: 'Jadi relawan paslon yang kalah. Janji "dana saksi" nggak dibayar. Rugi Rp 1.000.000.',
    effect: { kind: 'money', amount: -1_000_000 },
  },
  {
    id: 't9',
    deck: 'takdir',
    text: 'Viral jadi "crazy rich" dadakan karena pamer. Endorse mengalir: Rp 2.000.000.',
    effect: { kind: 'money', amount: 2_000_000 },
  },
  {
    id: 't10',
    deck: 'takdir',
    text: 'Warisan tanah kakek "mendadak" dilirik proyek strategis nasional. Ganti rugi Rp 3.500.000.',
    effect: { kind: 'money', amount: 3_500_000 },
  },
  {
    id: 't11',
    deck: 'takdir',
    text: 'Ketahuan nitip absen WFH sambil liburan ke Bali. Dipotong gaji Rp 1.200.000.',
    effect: { kind: 'money', amount: -1_200_000 },
  },
  {
    id: 't12',
    deck: 'takdir',
    text: 'Nikah mewah "settingan" biar dapat amplop banyak. Untung bersih Rp 1.800.000.',
    effect: { kind: 'money', amount: 1_800_000 },
  },
  {
    id: 't13',
    deck: 'takdir',
    text: 'Jadi buzzer politik bayaran musiman. Dapat "fee cuitan" Rp 900.000.',
    effect: { kind: 'money', amount: 900_000 },
  },
  {
    id: 't14',
    deck: 'takdir',
    text: 'Subsidi tepat sasaran (ke kamu, entah kenapa). Tiap pemain lain iri & nransfer "iuran" Rp 300.000.',
    effect: { kind: 'collect-each-player', amount: 300_000 },
  },
];

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(
  [...MUSIBAH_CARDS, ...TAKDIR_CARDS].map((c) => [c.id, c]),
);
