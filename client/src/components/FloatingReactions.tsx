import { useEffect, useState } from 'react';

export interface Reaction {
  id: number;
  emoji: string;
  x: number; // persen horizontal 0..100
}

interface Props {
  reactions: Reaction[];
}

/** Emoji yang melayang naik lalu hilang. */
export function FloatingReactions({ reactions }: Props) {
  return (
    <div className="reactions-layer">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="reaction"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

let seq = 0;
export function useReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const spawn = (emoji: string, count = 1) => {
    const batch: Reaction[] = Array.from({ length: count }).map(() => ({
      id: ++seq,
      emoji,
      x: 20 + Math.random() * 60,
    }));
    setReactions((prev) => [...prev, ...batch]);
  };

  // bersihkan reaksi lama
  useEffect(() => {
    if (reactions.length === 0) return;
    const t = window.setTimeout(() => {
      setReactions((prev) => prev.slice(Math.max(0, prev.length - 12)));
    }, 1800);
    return () => window.clearTimeout(t);
  }, [reactions]);

  return { reactions, spawn };
}
