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

Game ini perlu **2 bagian** yang di-deploy:

1. **Server** (Node) ke platform seperti **Railway / Render / Fly.io**.
   - Build: `npm install && npm run build`
   - Start: `node server/dist/index.js`
   - Set env `CLIENT_ORIGIN` ke URL frontend-mu (untuk CORS), dan `PORT` kalau
     diperlukan platform.
2. **Client** (static) ke **Vercel / Netlify / Cloudflare Pages**.
   - Build: `npm install && npm run build -w client`
   - Output: `client/dist`
   - Set env `VITE_SERVER_URL` ke URL public server (langkah 1).

Setelah keduanya online, cukup bagikan URL frontend + kode room ke temanmu. 🎉

## Catatan aturan

- Uang awal: Rp 15.000.000. Gaji lewat START: Rp 2.000.000.
- Dadu kembar → jalan lagi; kembar 3x berturut → penjara.
- Di penjara: lempar dadu kembar untuk bebas, atau bayar jaminan Rp 1.000.000,
  atau pakai kartu "Bebas Penjara". Maksimal 3 giliran.
- Bangkrut (uang < 0 dan tak bisa bayar) → tersingkir.
