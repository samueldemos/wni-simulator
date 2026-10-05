import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
}

/** Menampilkan angka uang yang beranimasi naik/turun menuju nilai target. */
export function AnimatedMoney({ value }: Props) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    setFlash(to > from ? 'up' : 'down');
    const start = performance.now();
    const duration = 600;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        fromRef.current = to;
        window.setTimeout(() => setFlash(null), 400);
      }
    };
    // Jika animasi terputus (nilai berubah lagi), lanjutkan dari posisi
    // terakhir yang tampil agar tidak melompat.
    fromRef.current = to;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span className={`money ${flash ?? ''}`}>
      Rp {display.toLocaleString('id-ID')}
    </span>
  );
}
