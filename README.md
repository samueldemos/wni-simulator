# 🇮🇩 WNI Simulator

Monopoli online bertema Indonesia. Beli kota, bangun properti, tarik Kartu
**Musibah** & **Takdir**, dan hati-hati **ketahuan korupsi** (masuk penjara +
50% kekayaan disita negara). Pemain terakhir yang bertahan menang.

Dibuat agar bisa dimainkan **real-time bareng teman dari jarak jauh** lewat
room code.

## Fitur

- 🎲 **Multiplayer real-time** (Socket.IO) — buat room, bagikan 4-huruf kode.
- 🗺️ **Papan Nusantara**: 5 pulau sebagai grup properti, harga naik dari
  **Papua → Kalimantan → Sulawesi → Sumatera → Jawa** (Jawa termahal, pusat
  peradaban).
- 🃏 **Kartu Musibah** (bisa menyeret pemain lain ke penjara, atau justru
  menguntungkan pemain lain) & **Kartu Takdir** (bisa baik atau apes).
- 🔒 **Aturan korupsi**: masuk penjara → 50% kekayaan disita negara. Selama di
  penjara, sewa properti yang kamu miliki **dibayarkan ke negara**, bukan ke
  kamu.
- 🏠 Bangun rumah/hotel setelah menguasai seluruh pulau.
- 💬 Chat & riwayat permainan.

## Struktur project (npm workspaces monorepo)

```
wni-simulator/
├── shared/   # types + data papan + kartu + protokol socket (dipakai server & client)
├── server/   # game engine otoritatif + Socket.IO server (Node + Express)
└── client/   # UI React + Vite
```

## Menjalankan secara lokal

> Butuh Node.js 18+ dan npm. (Catatan: harus di mesin dengan akses internet
> normal agar bisa `npm install`.)

```bash
# dari folder wni-simulator/
npm install          # install semua workspace sekaligus
npm run dev          # build shared, lalu jalankan server + client bersamaan
```

- Client: http://localhost:5173
- Server: http://localhost:3001

Buka client di dua tab/browser berbeda untuk mencoba sendiri: satu tab **Buat
Room Baru**, tab lain **Gabung Room** dengan kode yang muncul.

### Menjalankan terpisah

```bash
npm run build:shared          # wajib dulu (server & client mengimpor @wni/shared)
npm run dev:server            # port 3001
npm run dev:client            # port 5173
```

### Test engine

```bash
npm run test -w server
```

## Deploy agar bisa diakses teman lewat internet

Game ini perlu **2 bagian** yang di-deploy: **Server** ke Railway, **Client** ke
Vercel. Repo menyertakan `railway.json`, `render.yaml`, dan `vercel.json`.
(Render juga bisa pakai `render.yaml`, tapi kini butuh verifikasi kartu.)

### Langkah 1 — Deploy Server ke Railway

1. Buka https://railway.app, **Login with GitHub** (dapat kredit gratis, tanpa
   kartu di awal).
2. **New Project** -> **Deploy from GitHub repo** -> pilih `wni-simulator`.
   Railway membaca `railway.json` (build shared + server, start server).
3. Buka tab **Settings** service -> **Networking** -> **Generate Domain** agar
   dapat URL publik, mis. `https://wni-simulator-production.up.railway.app`.
4. Tunggu build selesai, lalu buka `URL/health` di browser, harus muncul
   `{"ok":true}`. Simpan URL ini untuk Langkah 2.

### Langkah 2 — Deploy Client ke Vercel

1. Buka https://vercel.com, **Sign in with GitHub**.
2. **Add New...** -> **Project** -> import repo `wni-simulator`.
3. Vercel membaca `vercel.json` (build & output sudah diatur). Sebelum deploy,
   buka **Environment Variables**, tambah:
   - `VITE_SERVER_URL` = URL server Render dari Langkah 1 (tanpa garis miring
     di akhir), mis. `https://wni-simulator-server.onrender.com`
4. Klik **Deploy**. Setelah selesai, kamu dapat URL frontend, mis.
   `https://wni-simulator.vercel.app`.

### Langkah 3 — Hubungkan keduanya (CORS)

1. Kembali ke Railway -> service server -> tab **Variables** -> tambah
   `CLIENT_ORIGIN` = URL Vercel dari Langkah 2 (mis.
   `https://wni-simulator.vercel.app`). Railway akan re-deploy otomatis.
2. Selesai! Buka URL Vercel, buat room, bagikan kode + link ke temanmu. 🎉

> Catatan: tier gratis bisa "tidur" saat idle; koneksi pertama kadang lambat
> beberapa detik saat server bangun. Wajar untuk tier gratis.

## Catatan aturan

- Uang awal: Rp 15.000.000. Gaji lewat START: Rp 2.000.000.
- Dadu kembar → jalan lagi; kembar 3x berturut → penjara.
- Di penjara: lempar dadu kembar untuk bebas, atau bayar jaminan Rp 1.000.000,
  atau pakai kartu "Bebas Penjara". Maksimal 3 giliran.
- Bangkrut (uang < 0 dan tak bisa bayar) → tersingkir.
