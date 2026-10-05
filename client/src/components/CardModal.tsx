import { useEffect, useState } from 'react';
import type { DrawnCard } from '../App';

interface Props {
  drawn: DrawnCard | null;
  onClose: () => void;
}

export function CardModal({ drawn, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (drawn) {
      setFlipped(false);
      // mulai flip sedikit setelah muncul
      const t = window.setTimeout(() => setFlipped(true), 150);
      return () => window.clearTimeout(t);
    }
  }, [drawn]);

  if (!drawn) return null;

  const isMusibah = drawn.deck === 'musibah';
  // emoji yang "jalan" di background sesuai jenis kartu
  const driftEmojis = isMusibah
    ? ['⚠️', '🚔', '💸', '🔥', '📉', '😱', '⛓️']
    : ['✨', '💰', '🍀', '🎉', '📈', '😎', '🤑'];

  return (
    <div className={`card-overlay ${drawn.deck}`} onClick={onClose}>
      {/* Background beranimasi: emoji melintas pelan */}
      <div className="card-bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="card-bg-item"
            style={{
              left: `${(i * 7.5) % 100}%`,
              animationDelay: `${(i % 7) * 0.6}s`,
              animationDuration: `${6 + (i % 5)}s`,
              fontSize: `${22 + (i % 4) * 10}px`,
            }}
          >
            {driftEmojis[i % driftEmojis.length]}
          </span>
        ))}
      </div>
      <div
        className={`flip-card ${flipped ? 'flipped' : ''} ${drawn.deck}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flip-inner">
          {/* belakang kartu (sebelum flip) */}
          <div className="flip-back">
            <div className="flip-back-icon">{isMusibah ? '⚠️' : '✨'}</div>
            <div className="flip-back-label">
              {isMusibah ? 'MUSIBAH' : 'TAKDIR'}
            </div>
          </div>
          {/* depan kartu (isi) */}
          <div className="flip-front">
            <div className="flip-front-title">
              {isMusibah ? '⚠️ Kartu Musibah' : '✨ Kartu Takdir'}
            </div>
            <div className="flip-front-text">{drawn.card.text}</div>
            <button className="btn small flip-close" onClick={onClose}>
              Oke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
