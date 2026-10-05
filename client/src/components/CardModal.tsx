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

  return (
    <div className="card-overlay" onClick={onClose}>
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
