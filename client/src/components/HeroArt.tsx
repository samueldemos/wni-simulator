import { useState } from 'react';

/**
 * Slot ilustrasi hero.
 * - Jika file `public/illustrations/hero.png` ADA -> tampilkan gambar.
 * - Jika TIDAK ada (gagal load) -> fallback ke "cast" emoji karakter WNI.
 *
 * Cara mengganti dengan ilustrasi asli nanti: taruh file bernama `hero.png`
 * (atau .jpg/.webp, lalu sesuaikan HERO_SRC) di folder client/public/illustrations/.
 */
const HERO_SRC = '/illustrations/hero.png';

// Karakter WNI (pengganti sementara yang jujur, bukan placeholder nyamar).
const CAST = ['🧕', '🛵', '👮', '🕴️', '💂', '🧑‍🌾', '👨‍🍳', '🤵', '💸', '📄'];

export function HeroArt() {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="hero-art" aria-label="Ilustrasi WNI Simulator">
      {imgOk ? (
        <img
          className="hero-art-img"
          src={HERO_SRC}
          alt="Ilustrasi warga +62 di tengah birokrasi"
          onError={() => setImgOk(false)}
        />
      ) : (
        <>
          <div className="hero-art-plate">WNI SIMULATOR_</div>
          <div className="hero-art-cast">
            {CAST.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
          <div className="hero-art-note">
            Bertahan hidup di tengah kerasnya birokrasi &amp; nasib warga +62.
          </div>
        </>
      )}
    </div>
  );
}
