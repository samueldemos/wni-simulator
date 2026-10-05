import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE, type Player } from '@wni/shared';
import { sfx } from './sound';

const STEP_MS = 300; // kecepatan jalan per petak (sinkron dgn useGameSequencer)

/**
 * Mengembalikan posisi "tampilan" tiap pemain yang mengejar posisi
 * sebenarnya satu petak demi satu petak (animasi berjalan).
 *
 * Implementasi: kita simpan posisi tampilan di ref + state. Setiap kali
 * posisi target berubah, kita jalankan interval yang memajukan posisi
 * tampilan satu langkah tiap STEP_MS sampai sama dengan target.
 */
export function useStepPositions(players: Player[]): {
  display: Record<string, number>;
} {
  const [display, setDisplay] = useState<Record<string, number>>(() =>
    Object.fromEntries(players.map((p) => [p.id, p.position])),
  );
  // sumber kebenaran posisi tampilan (agar tidak bergantung closure state)
  const posRef = useRef<Record<string, number>>({ ...display });
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    for (const p of players) {
      // pemain baru -> set langsung tanpa animasi
      if (posRef.current[p.id] === undefined) {
        posRef.current[p.id] = p.position;
        setDisplay((d) => ({ ...d, [p.id]: p.position }));
        continue;
      }

      const target = p.position;
      const curr = posRef.current[p.id];
      if (curr === target) continue;
      if (timersRef.current[p.id]) continue; // animasi sedang berjalan

      const forwardSteps = (target - curr + BOARD_SIZE) % BOARD_SIZE;
      const backwardSteps = (curr - target + BOARD_SIZE) % BOARD_SIZE;
      const goBackward =
        backwardSteps > 0 && backwardSteps < forwardSteps && backwardSteps <= 4;

      timersRef.current[p.id] = window.setInterval(() => {
        const cur = posRef.current[p.id];
        const next = goBackward
          ? (cur - 1 + BOARD_SIZE) % BOARD_SIZE
          : (cur + 1) % BOARD_SIZE;
        posRef.current[p.id] = next;
        setDisplay((d) => ({ ...d, [p.id]: next }));
        sfx.step();
        if (next === target) {
          window.clearInterval(timersRef.current[p.id]);
          delete timersRef.current[p.id];
        }
      }, STEP_MS);
    }

    // bersihkan pemain yang sudah tidak ada
    const ids = new Set(players.map((p) => p.id));
    for (const id of Object.keys(posRef.current)) {
      if (!ids.has(id)) {
        if (timersRef.current[id]) {
          window.clearInterval(timersRef.current[id]);
          delete timersRef.current[id];
        }
        delete posRef.current[id];
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.map((p) => `${p.id}:${p.position}`).join(',')]);

  // cleanup saat unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of Object.keys(timers)) window.clearInterval(timers[id]);
    };
  }, []);

  return { display };
}
