# WNI Simulator — Design Direction

Arah desain (soul) untuk game. antislop dipakai sebagai filter di atas arah ini.

## Design Read

Reading this as: **game lobby + papan permainan online** untuk **anak muda
Indonesia yang main bareng teman**, dengan **visual language playful-satir khas
Indonesia** (merah / emas / hijau warkop), dial **ENERGY 3 / RHYTHM 2 / MOTION 2**.

- **ENERGY 3** — ini game yang harus terasa ramai & seru, bukan situs korporat.
- **RHYTHM 2** — ada beberapa komposisi berbeda (landing, lobby, papan), tapi
  papan sendiri grid teratur; konsisten dengan beberapa variasi.
- **MOTION 2** — animasi dadu/bidak/kartu adalah inti pengalaman, tapi tidak
  sampai parallax/choreography berlebihan.

## Identitas

- **Palet inti (R-29):** Merah (`#ef4444`) + Emas (`#ffc23d`) + Hijau warkop
  (`#0d7a56`) sebagai 3 warna inti, dengan netral gelap (bg) di luar hitungan.
  Biru (`#3b82f6`) hanya aksen minor (nama di chat). Alasan: merah-putih &
  emas = nuansa Indonesia; hijau = meja permainan ("felt").
- **Tipografi (R-06):** Inter untuk UI/teks, Plus Jakarta Sans untuk heading.
  Alasan: Inter sangat terbaca untuk angka Rupiah & UI padat (tabular-nums);
  Plus Jakarta Sans memberi karakter heading yang modern tapi hangat. Bukan
  dipilih karena default, tapi karena keterbacaan angka & kepadatan UI.

## Alasan tiap keputusan besar (R-31)

- **Warna papan hijau felt:** meniru meja permainan papan sungguhan, memperkuat
  rasa "board game", bukan sekadar dark mode "biar techy".
- **Glow emas hanya di petak aktif & tombol primary (R-13):** glow dipakai
  sebagai penanda fokus — petak aktif menunjukkan giliran siapa; tombol primary
  menandai aksi utama. Tidak dipakai di mana-mana.
- **Glassmorphism hanya di topbar & modal kartu (R-10):** blur dipakai agar
  elemen yang "mengambang di atas konten" (bar lengket & modal) terasa
  berlapis; panel & kartu lain solid agar teks tetap tajam & kontras tinggi.
- **Dark theme (R-21):** dipilih karena game dimainkan santai (sering malam),
  dan papan hijau + warna properti lebih "pop" di atas latar gelap. Ini
  keputusan identitas, bukan "dark biar tech".
- **Avatar emoji/foto:** memberi identitas pemain yang personal & lucu (karakter
  khas WNI), bukan ikon generik.
- **Istilah savage (Pungli, Rutan KPK, dll):** inti identitas game — satir
  sosial Indonesia. Ini direction, bukan slop.

## Catatan

- Font dimuat dari Google Fonts (butuh internet saat load). Jika ingin offline,
  bisa di-self-host nanti.
