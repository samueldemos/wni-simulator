import { useEffect, useState } from 'react';

interface Props {
  values: [number, number] | null;
  rolling: boolean;
}

// Posisi pip (titik) untuk tiap angka 1..6 dalam grid 3x3.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!rolling) {
      setDisplay(value);
      return;
    }
    // kedip-kedip angka acak selama rolling
    const id = window.setInterval(() => {
      setDisplay(1 + Math.floor(Math.random() * 6));
    }, 80);
    return () => window.clearInterval(id);
  }, [rolling, value]);

  return (
    <div className={`die ${rolling ? 'rolling' : ''}`}>
      <div className="die-face">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`pip ${PIPS[display]?.includes(i) ? 'on' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export function Dice({ values, rolling }: Props) {
  const [d1, d2] = values ?? [1, 1];
  return (
    <div className="dice-tray">
      <Die value={d1} rolling={rolling} />
      <Die value={d2} rolling={rolling} />
    </div>
  );
}
