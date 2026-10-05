import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE, type GameState } from '@wni/shared';
import type { DrawnCard } from './App';

export const DICE_ROLL_MS = 900; // lama dadu "menggelinding"
export const STEP_MS = 300; // lama jalan per petak (sinkron dgn useStepPositions)
const SETTLE_MS = 450; // jeda santai setelah bidak sampai, sebelum efek muncul

/**
 * Mengatur urutan animasi agar tenang & berurutan:
 *   lempar dadu -> dadu berhenti -> bidak jalan pelan-pelan -> sampai ->
 *   (jeda) -> kartu + efek uang muncul.
 *
 * Prinsip penting (perbaikan bug): state final SELALU diterapkan di akhir
 * sekuens, apa pun yang terjadi. Jadi perubahan uang / posisi akibat KARTU
 * (mis. "mundur 2 langkah", "+900K") tidak pernah hilang. Sequencer hanya
 * menunda tampilannya, tidak membuangnya.
 */
export function useGameSequencer(
  rawState: GameState | null,
  rawCard: DrawnCard | null,
  clearRawCard: () => void,
) {
  const [presented, setPresented] = useState<GameState | null>(rawState);
  const [card, setCard] = useState<DrawnCard | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [busy, setBusy] = useState(false);

  // state yang terakhir SUDAH dianimasikan (bukan ref ke rawState mentah,
  // supaya StrictMode double-invoke tidak merusak deteksi perubahan).
  const shownRef = useRef<GameState | null>(null);
  const processedKeyRef = useRef<string>('');
  const pendingCardRef = useRef<DrawnCard | null>(null);
  const timers = useRef<number[]>([]);

  // Tangkap kartu dari server; tahan dulu sampai bidak sampai.
  useEffect(() => {
    if (rawCard) {
      pendingCardRef.current = rawCard;
      clearRawCard();
    }
  }, [rawCard, clearRawCard]);

  useEffect(() => {
    if (!rawState) return;

    // Kunci unik per state (hindari proses ganda akibat StrictMode / re-render).
    const key = stateKey(rawState);
    if (key === processedKeyRef.current) return;
    processedKeyRef.current = key;

    // State pertama: tampilkan langsung.
    if (!shownRef.current) {
      shownRef.current = rawState;
      setPresented(rawState);
      return;
    }

    const prev = shownRef.current;
    shownRef.current = rawState;

    // Gerakan terbesar (dari dadu ATAU kartu) -> durasi jalan.
    let maxSteps = 0;
    for (const p of rawState.players) {
      const old = prev.players.find((x) => x.id === p.id);
      if (!old || old.position === p.position) continue;
      const fwd = (p.position - old.position + BOARD_SIZE) % BOARD_SIZE;
      const bwd = (old.position - p.position + BOARD_SIZE) % BOARD_SIZE;
      maxSteps = Math.max(maxSteps, Math.min(fwd, bwd));
    }

    const diceChanged =
      rawState.lastDice !== null &&
      JSON.stringify(rawState.lastDice) !== JSON.stringify(prev.lastDice);

    clearTimers(timers.current);

    // Perubahan tanpa gerak & tanpa dadu (beli properti, bangun, chat, end turn):
    // terapkan langsung + munculkan kartu bila ada.
    if (maxSteps === 0 && !diceChanged) {
      setPresented(rawState);
      flushCard();
      return;
    }

    // Mulai sekuens beranimasi.
    setBusy(true);
    let t = 0;

    if (diceChanged) {
      setDiceRolling(true);
      timers.current.push(
        window.setTimeout(() => setDiceRolling(false), DICE_ROLL_MS),
      );
      t += DICE_ROLL_MS;
    }

    // Setelah dadu berhenti: terapkan POSISI (bidak mulai jalan), tahan efek.
    timers.current.push(
      window.setTimeout(() => {
        setPresented(mergePositions(prev, rawState));
      }, t),
    );

    t += maxSteps * STEP_MS;

    // Setelah bidak sampai + jeda: tampilkan state final (uang, properti) + kartu.
    timers.current.push(
      window.setTimeout(() => {
        setPresented(rawState);
        flushCard();
      }, t + SETTLE_MS),
    );

    // Pengaman: apa pun yang terjadi, state final pasti terpasang.
    timers.current.push(
      window.setTimeout(() => {
        setPresented(rawState);
        setBusy(false);
        setDiceRolling(false);
      }, t + SETTLE_MS + 200),
    );

    function flushCard() {
      const pc = pendingCardRef.current;
      if (pc) {
        pendingCardRef.current = null;
        setCard(pc);
      }
    }
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

/** Tanda tangan state untuk mendeteksi perubahan nyata (bukan re-render). */
function stateKey(s: GameState): string {
  return [
    s.phase,
    s.currentPlayerIndex,
    s.turnStage,
    JSON.stringify(s.lastDice),
    s.pot,
    s.pendingUpgradeFor ?? '-',
    s.pendingTolFor ?? '-',
    s.players.map((p) => `${p.id}:${p.position}:${p.money}:${p.inJail ? 1 : 0}:${p.bankrupt ? 1 : 0}`).join('|'),
    s.properties.map((p) => `${p.tileIndex}:${p.ownerId ?? '-'}:${p.level}`).join('|'),
  ].join('#');
}

/** Posisi dari `next`, selebihnya (uang, properti, pot) dari `prev`. */
function mergePositions(prev: GameState, next: GameState): GameState {
  return {
    ...prev,
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
