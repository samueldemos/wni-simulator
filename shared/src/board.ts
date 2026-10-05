import type { Card, Island, PropertyTile, Tile } from './types.js';

// ============================================================
// Board layout - 40 petak (perimeter grid 11x11, 10 per sisi).
// Harga naik dari Papua (termurah) -> Jawa (termahal).
// 4 Jalan Tol (seperti "stasiun"): bayar + bisa teleport ke tol lain.
// ============================================================

// Helper: bikin properti dengan sewa & biaya upgrade otomatis dari harga.
// rent = [tanah kosong, rumah subsidi, rumah OKB]
// upgradeCost = [-> subsidi, -> OKB]
function prop(
  index: number,
  name: string,
  island: Island,
  price: number,
): PropertyTile {
  const base = Math.round(price * 0.08); // sewa tanah kosong ~8% harga
  return {
    index,
    type: 'property',
    name,
    island,
    price,
    rent: [base, base * 5, base * 14],
    upgradeCost: [Math.round(price * 0.6), Math.round(price * 1.1)],
  };
}

export const BOARD: Tile[] = [
  // ===== SISI BAWAH (kiri->kanan dibalik saat render) index 0..10 =====
  { index: 0, type: 'start', name: 'START (Gajian!)' },

  // PAPUA (termurah)
  prop(1, 'Jayapura', 'papua', 600_000),
  { index: 2, type: 'musibah', name: 'Kartu Musibah' },
  prop(3, 'Merauke', 'papua', 700_000),
  prop(4, 'Raja Ampat', 'papua', 800_000),
  { index: 5, type: 'tax', name: 'Pungli Oknum', amount: 1_000_000 },
  prop(6, 'Wamena', 'papua', 1_000_000),
  { index: 7, type: 'tol', name: 'Tol Trans-Papua' },
  prop(8, 'Timika', 'papua', 1_100_000),
  { index: 9, type: 'takdir', name: 'Kartu Takdir' },
  prop(10, 'Sorong', 'papua', 1_200_000),

  // ===== POJOK: Rutan KPK (penjara) index 10 is corner above; next side =====
  // KALIMANTAN
  prop(11, 'Pontianak', 'kalimantan', 1_400_000),
  { index: 12, type: 'musibah', name: 'Kartu Musibah' },
  prop(13, 'Palangkaraya', 'kalimantan', 1_500_000),
  prop(14, 'Banjarmasin', 'kalimantan', 1_600_000),
  { index: 15, type: 'tol', name: 'Tol Balikpapan-Samarinda' },
  prop(16, 'Balikpapan', 'kalimantan', 1_800_000),
  { index: 17, type: 'takdir', name: 'Kartu Takdir' },
  prop(18, 'Samarinda', 'kalimantan', 1_900_000),
  { index: 19, type: 'tax', name: 'Jatah Preman', amount: 1_500_000 },
  prop(20, 'IKN Nusantara', 'kalimantan', 2_200_000),

  // ===== POJOK (index 20 area) lalu SULAWESI =====
  prop(21, 'Makassar', 'sulawesi', 2_300_000),
  { index: 22, type: 'musibah', name: 'Kartu Musibah' },
  prop(23, 'Manado', 'sulawesi', 2_400_000),
  prop(24, 'Palu', 'sulawesi', 2_500_000),
  { index: 25, type: 'tol', name: 'Tol Makassar' },
  prop(26, 'Kendari', 'sulawesi', 2_600_000),
  { index: 27, type: 'takdir', name: 'Kartu Takdir' },
  prop(28, 'Gorontalo', 'sulawesi', 2_700_000),
  { index: 29, type: 'tax', name: 'Pajak Sultan', amount: 2_000_000 },
  prop(30, 'Parepare', 'sulawesi', 2_800_000),

  // ===== POJOK lalu SUMATERA + JAWA (termahal) =====
  prop(31, 'Palembang', 'sumatera', 3_000_000),
  { index: 32, type: 'musibah', name: 'Kartu Musibah' },
  prop(33, 'Padang', 'sumatera', 3_200_000),
  prop(34, 'Medan', 'sumatera', 3_400_000),
  { index: 35, type: 'tol', name: 'Tol Trans-Jawa' },
  prop(36, 'Semarang', 'jawa', 3_800_000),
  { index: 37, type: 'takdir', name: 'Kartu Takdir' },
  prop(38, 'Surabaya', 'jawa', 4_200_000),
  prop(39, 'Bandung', 'jawa', 4_600_000),
];

// Sisipkan 4 petak pojok secara logis lewat index khusus di render.
// Catatan: untuk kesederhanaan, pojok (Rutan KPK, OTT KPK, Warkop) kita
// tempatkan sebagai petak khusus menggantikan sebagian index di atas bila
// perlu. Di sini kita jadikan 40 petak penuh dengan menyisipkan corner:
// Kita override beberapa index agar ada 4 corner tetap.

// --- Corner overrides: pastikan ada Rutan KPK, Warkop, OTT KPK, + START ---
// START sudah di index 0 (pojok kanan-bawah).
// Pojok lain pada grid 11x11 ada di index 10, 20, 30.
BOARD[10] = { index: 10, type: 'jail', name: 'Rutan KPK' };
BOARD[20] = { index: 20, type: 'free', name: 'Warkop (Ngopi Dulu)' };
BOARD[30] = { index: 30, type: 'goto-jail', name: 'OTT KPK!' };

export const BOARD_SIZE = BOARD.length; // 40

/** Index semua petak Jalan Tol (untuk teleport). */
export const TOL_INDICES = BOARD.filter((t) => t.type === 'tol').map(
  (t) => t.index,
);

// ============================================================
// Kartu Musibah (disaster) - savage, "WNI tersiksa".
// ============================================================

export const MUSIBAH_CARDS: Card[] = [
  {
    id: 'm1',
    deck: 'musibah',
    text: 'Pemerintah mau bikin jalan tol. Tanah kosongmu disita, ganti rugi "nyusul" (tidak ada).',
    effect: { kind: 'seize-empty-land' },
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
    text: 'Kongkalikong tender ketahuan. Kamu nyanyi & seret 1 kolega ikut masuk Rutan!',
    effect: { kind: 'drag-random-player-to-jail' },
  },
  {
    id: 'm4',
    deck: 'musibah',
    text: 'Tanah kosongmu nganggur 5 tahun tanpa bangunan. Negara menyita lahan telantarmu.',
    effect: { kind: 'seize-empty-land' },
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
    text: 'Macet 4 jam gara-gara ada "orang penting" lewat (jalan ditutup). Mundur 3 langkah.',
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
    text: 'Antre BPJS dari subuh, nomor antrean 312, pulang tanpa dilayani. Mundur 2 langkah.',
    effect: { kind: 'move-by', steps: -2 },
  },
  {
    id: 'm13',
    deck: 'musibah',
    text: 'Token listrik habis tengah malam, isi pulsa + "biaya admin" mencekik. Rugi Rp 350.000.',
    effect: { kind: 'money', amount: -350_000 },
  },
  {
    id: 'm14',
    deck: 'musibah',
    text: 'Jadi "tumbal" di kantor pas ada masalah. Bayar Rp 350.000 tiap pemain lain.',
    effect: { kind: 'pay-each-player', amount: 350_000 },
  },
  {
    id: 'm15',
    deck: 'musibah',
    text: 'Proyek fiktif ketahuan BPK. Kembalikan Rp 2.000.000 ke negara.',
    effect: { kind: 'money', amount: -2_000_000 },
  },
];

// ============================================================
// Kartu Takdir (fate) - bisa hoki ala WNI, bisa apes.
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
    text: 'Menang giveaway sultan medsos (follow & tag 3 teman). Dapat Rp 1.500.000.',
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
    text: 'THR cair! Dipanggil pulang kampung. Maju ke START dan terima gajian.',
    effect: { kind: 'move-to', tileIndex: 0, collectIfPass: true },
  },
  {
    id: 't6',
    deck: 'takdir',
    text: 'Dipanggil "studi banding" ke Bandung (modus liburan dinas). Melaju ke Bandung.',
    effect: { kind: 'move-to', tileIndex: 39, collectIfPass: true },
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
    text: 'Jadi relawan paslon yang kalah. "Dana saksi" nggak dibayar. Rugi Rp 1.000.000.',
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
    text: 'Warisan tanah kakek dilirik proyek strategis nasional. Ganti rugi Rp 3.500.000.',
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
    text: 'Subsidi tepat sasaran (ke kamu, entah kenapa). Tiap pemain lain "iuran" Rp 300.000.',
    effect: { kind: 'collect-each-player', amount: 300_000 },
  },
  {
    id: 't15',
    deck: 'takdir',
    text: 'Dapat proyek bagi-bagi sembako jelang pemilu. Terima Rp 1.600.000.',
    effect: { kind: 'money', amount: 1_600_000 },
  },
];

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(
  [...MUSIBAH_CARDS, ...TAKDIR_CARDS].map((c) => [c.id, c]),
);
