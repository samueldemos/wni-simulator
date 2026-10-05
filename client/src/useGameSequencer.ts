import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE, type GameState } from '@wni/shared';
import type { DrawnCard } from './App';

export const DICE_ROLL_MS = 900; // lama dadu "menggelinding"
export const STEP_MS = 300; // lama jalan per petak (sinkron dgn useStepPositions)
const SETTLE_MS = 450; // jeda santai setelah bidak sampai, sebelum efek muncul

type Pending = { card: DrawnCard | null; resolvedState: GameState };

/**
 * Mengatur agar urutan animasi tenang & berurutan:
 *   lempar dadu -> dadu berhenti -> bidak jalan pelan-pelan ->
 *   sampai -> (jeda) -> kartu & efek uang baru muncul.
 *
 * Caranya: kita TAHAN penerapan state final ke UI sampai animasi selesai.
 * - `presented` = state yang benar-benar dirender (tertunda).
 * - kartu disimpan dulu, baru dimunculkan setelah bidak sampai.
 */
export function useGameSequencer(
  rawState: GameState | null,
  rawCard: DrawnCard | null,
  clearRawCard: () => void,
) {
  const [presented, setPresented] = useState<GameState | null>(rawState);
  const [card, setCard] = useState<DrawnCard | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [busy, setBusy] = useState(false); // true selama animasi berjalan

  const prevRef = useRef<GameState | null>(null);
  const pendingCardRef = useRef<DrawnCard | null>(null);
  const timers = useRef<number[]>([]);

  // tangkap kartu yang datang dari server; jangan tampilkan dulu.
  useEffect(() => {
    if (rawCard) {
      pendingCardRef.current = rawCard;
      clearRawCard(); // ambil alih kontrol tampil kartu
    }
  }, [rawCard, clearRawCard]);

  useEffect(() => {
    if (!rawState) return;

    // state pertama: tampilkan langsung tanpa animasi.
    if (!prevRef.current) {
      prevRef.current = rawState;
      setPresented(rawState);
      return;
    }

    const prev = prevRef.current;

    // Deteksi apakah ada pemain yang BERGERAK (butuh animasi jalan).
    let maxSteps = 0;
    for (const p of rawState.players) {
      const old = prev.players.find((x) => x.id === p.id);
      if (!old) continue;
      if (old.position !== p.position) {
        const fwd = (p.position - old.position + BOARD_SIZE) % BOARD_SIZE;
        const bwd = (old.position - p.position + BOARD_SIZE) % BOARD_SIZE;
        const steps = Math.min(fwd, bwd <= 4 ? bwd : fwd);
        maxSteps = Math.max(maxSteps, steps);
      }
    }

    // Apakah dadu baru dilempar? (lastDice berubah / baru ada)
    const diceChanged =
      JSON.stringify(rawState.lastDice) !== JSON.stringify(prev.lastDice) &&
      rawState.lastDice !== null;

    prevRef.current = rawState;

    // Tidak ada gerakan & tidak ada dadu baru -> update biasa (mis. beli, chat).
    if (maxSteps === 0 && !diceChanged) {
      setPresented(rawState);
      const pc = pendingCardRef.current;
      if (pc) {
        pendingCardRef.current = null;
        setCard(pc);
      }
      return;
    }

    // Mulai sekuens beranimasi.
    setBusy(true);
    clearTimers(timers.current);

    let t = 0;
    if (diceChanged) {
      setDiceRolling(true);
      // Selama dadu bergulir, JANGAN gerakkan bidak dulu: tahan presented di posisi lama.
      // (presented masih prev, jadi bidak belum pindah)
      timers.current.push(
        window.setTimeout(() => {
          setDiceRolling(false);
        }, DICE_ROLL_MS),
      );
      t += DICE_ROLL_MS;
    }

    // Setelah dadu berhenti: terapkan POSISI baru supaya bidak mulai jalan,
    // TAPI tahan uang/properti/kartu sampai bidak sampai.
    // Kita render posisi dari rawState (bidak animasi via useStepPositions),
    // sementara data lain tetap dari prev agar efek belum terlihat.
    timers.current.push(
      window.setTimeout(() => {
        setPresented(mergePositions(prev, rawState));
      }, t),
    );

    const walkMs = maxSteps * STEP_MS;
    t += walkMs;

    // Setelah bidak sampai + jeda santai: tampilkan state final + kartu + efek.
    timers.current.push(
      window.setTimeout(() => {
        setPresented(rawState);
        const pc = pendingCardRef.current;
        if (pc) {
          pendingCardRef.current = null;
          setCard(pc);
        }
      }, t + SETTLE_MS),
    );

    // selesai animasi
    timers.current.push(
      window.setTimeout(() => {
        setBusy(false);
      }, t + SETTLE_MS + 150),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawState]);

  useEffect(() => {
    const list = timers.current;
    return () => clearTimers(list);
  }, []);

  return {
    presented: presented ?? rawState,
    card,
    closeCard: () => setCard(null),
    diceRolling,
    busy,
  };
}

/** Ambil posisi dari `next`, selebihnya (uang, properti, log, pot) dari `prev`. */
function mergePositions(prev: GameState, next: GameState): GameState {
  return {
    ...prev,
    // dadu & giliran ikut next supaya tampilan dadu benar
    lastDice: next.lastDice,
    currentPlayerIndex: next.currentPlayerIndex,
    turnStage: prev.turnStage,
    players: prev.players.map((pp) => {
      const np = next.players.find((x) => x.id === pp.id);
      return np ? { ...pp, position: np.position, inJail: np.inJail } : pp;
    }),
  };
}

function clearTimers(list: number[]) {
  while (list.length) {
    const id = list.pop();
    if (id !== undefined) window.clearTimeout(id);
  }
}
