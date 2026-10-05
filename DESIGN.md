# WNI Simulator — Design Direction

Arah desain (soul) untuk game. antislop dipakai sebagai filter di atas arah ini.

## Design Read

Reading this as: **game satir Indonesia** untuk **anak muda yang main bareng
teman**, dengan **visual language zine / komik pop Indonesia** (kuning cerah +
hitam tebal + merah), dial **ENERGY 3 / RHYTHM 3 / MOTION 2**.

- **ENERGY 3** — bold, punchy, berani; poster yang "teriak" (headline raksasa).
- **RHYTHM 3** — komposisi bervariasi & asimetris (landing beda dari papan),
  blok hitam tegas, bukan grid kartu seragam.
- **MOTION 2** — animasi dadu/bidak/kartu inti; plus micro-interaction tegas
  (hover geser + bayangan keras), tanpa parallax berlebihan.

## Identitas (zine pop Indonesia)

- **Palet inti (R-29):** Kuning (`#ffd21e`) sebagai dominan latar + Hitam
  (`#121212`) untuk teks/blok + Merah (`#e23b2e`) sebagai aksen tunggal.
  Putih (`#ffffff`) netral. Alasan: kuning-hitam-merah = berani, meriah, sangat
  "Indonesia jalanan", persis vibe poster yang jadi acuan. Satu aksen (merah)
  dipakai hemat untuk momen penting (CTA, highlight headline).
- **Tipografi (R-06):** Headline pakai **Archivo Black / font sangat tebal
  kapital** (gaya poster "SUDAH DIBUKA!"); body pakai **Inter**. Alasan:
  headline chunky = karakter zine/komik yang bold; Inter untuk keterbacaan
  teks & angka Rupiah. Dipilih karena karakter, bukan default.

## Treatment khas (bukan slop, ini identitas)

- **Blok hitam tegas** untuk tombol & kotak info (bukan kartu glass halus).
- **Hard shadow / offset shadow** (bayangan keras bergeser, bukan blur lembut) —
  gaya stiker/zine. Ini pengganti sadar dari soft-shadow default.
- **Border hitam tebal** (2-3px) di elemen kunci.
- **Grid kuning halus** di latar: dibolehkan di sini karena ini bagian identitas
  poster (bukan "blueprint techy" default). Alasan ditulis = lolos R-07.
- **Hover: geser + bayangan** (bukan glow). Tegas, playful.

## Ilustrasi (R-22, R-23)

- Belum ada ilustrasi asli. Sementara pakai **emoji karakter besar** sebagai
  pengganti yang **jujur** (bukan placeholder nyamar jadi final).
- Slot gambar sudah disiapkan: taruh file di `client/public/illustrations/`
  (mis. `hero.png`). Komponen `HeroArt` otomatis memakai gambar jika ada,
  dan jatuh ke emoji bila tidak. Lihat README.

## Alasan tiap keputusan besar (R-31)

- **Latar kuning (bukan dark):** identitas poster acuan; ceria & berani, bukan
  "dark biar techy".
- **Merah sebagai satu-satunya aksen:** fokus ke CTA & kata kunci headline.
- **Hard offset shadow:** memberi karakter zine/stiker, pengganti sadar dari
  soft-shadow AI default.
- **Grid kuning halus:** elemen identitas poster, dosis tipis, bukan background
  blueprint generik.
- **Istilah savage (Pungli, Rutan KPK, dll):** inti identitas satir sosial.

## Catatan

- Font dari Google Fonts (butuh internet saat load). Bisa self-host nanti.
