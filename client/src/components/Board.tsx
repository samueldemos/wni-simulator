import {
  BOARD,
  ISLAND_COLOR,
  ISLAND_LABEL,
  LEVEL_ICON,
  LEVEL_LABEL,
  type GameState,
  type PropertyTile,
  type Tile,
} from '@wni/shared';
import { useStepPositions } from '../useStepPositions';

interface Props {
  state: GameState;
}

const SIDE = 11; // 11x11 grid -> perimeter = 40 cells.

function gridPos(index: number): { row: number; col: number } {
  const n = index;
  if (n <= 10) {
    return { row: SIDE, col: SIDE - n }; // bawah: kanan -> kiri (col 11..1)
  } else if (n <= 20) {
    return { row: SIDE - (n - 10), col: 1 }; // kiri: bawah -> atas (row 11..1)
  } else if (n <= 30) {
    return { row: 1, col: 1 + (n - 20) }; // atas: kiri -> kanan (col 1..11)
  } else {
    return { row: 1 + (n - 30), col: SIDE }; // kanan: atas -> bawah (row 1..11)
  }
}

function tileLabel(tile: Tile): string {
  switch (tile.type) {
    case 'start':
      return 'START';
    case 'musibah':
      return 'MUSIBAH';
    case 'takdir':
      return 'TAKDIR';
    case 'tax':
      return tile.name;
    case 'jail':
      return 'PENJARA';
    case 'goto-jail':
      return 'KPK!';
    case 'free':
      return 'WARKOP';
    case 'tol':
      return 'PINTU TOL';
    case 'property':
      return tile.name;
  }
}

function tileIcon(tile: Tile): string {
  switch (tile.type) {
    case 'start':
      return '🏁';
    case 'musibah':
      return '⚠️';
    case 'takdir':
      return '✨';
    case 'tax':
      return '💸';
    case 'jail':
      return '🔒';
    case 'goto-jail':
      return '🚔';
    case 'free':
      return '☕';
    case 'tol':
      return '🛣️';
    case 'property':
      return '🏙️';
  }
}

// Emoji ikon kecil per pulau untuk hiasan papan tengah.
const ISLAND_EMOJI: Record<string, string> = {
  papua: '🏝️',
  kalimantan: '🌳',
  sulawesi: '🐟',
  sumatera: '🐯',
  jawa: '🏙️',
};

export function Board({ state }: Props) {
  const current = state.players[state.currentPlayerIndex];
  const alive = state.players.filter((p) => !p.bankrupt);
  const { display } = useStepPositions(alive);

  return (
    <div className="board">
      {BOARD.map((tile) => {
        const { row, col } = gridPos(tile.index);
        const prop =
          tile.type === 'property'
            ? state.properties.find((p) => p.tileIndex === tile.index)
            : undefined;
        const owner =
          prop?.ownerId != null
            ? state.players.find((p) => p.id === prop.ownerId)
            : undefined;
        const isProperty = tile.type === 'property';
        const islandColor = isProperty
          ? ISLAND_COLOR[(tile as PropertyTile).island]
          : undefined;
        const isActive = current && current.position === tile.index;

        return (
          <div
            key={tile.index}
            className={`tile tile-${tile.type} ${isActive ? 'tile-active' : ''}`}
            style={{ gridRow: row, gridColumn: col }}
          >
            {isProperty && (
              <div className="tile-band" style={{ background: islandColor }} />
            )}
            {!isProperty && <div className="tile-icon">{tileIcon(tile)}</div>}
            <div className="tile-name">{tileLabel(tile)}</div>
            {isProperty && (
              <div className="tile-price">
                {(tile as PropertyTile).price.toLocaleString('id-ID')}
              </div>
            )}
            {prop && prop.ownerId && (
              <div
                className={`tile-level level-${prop.level}`}
                title={LEVEL_LABEL[prop.level]}
              >
                {LEVEL_ICON[prop.level]}
              </div>
            )}
            {owner && (
              <div
                className="tile-owner"
                style={{ background: owner.color }}
                title={`Milik ${owner.name}`}
              />
            )}
          </div>
        );
      })}

      {/* Bidak pemain: posisi dari display (animasi jalan per petak) */}
      {alive.map((p) => {
        const pos = display[p.id] ?? p.position;
        const { row, col } = gridPos(pos);
        const sameTile = alive.filter(
          (x) => (display[x.id] ?? x.position) === pos,
        );
        const idx = sameTile.findIndex((x) => x.id === p.id);
        const nudge = idx * 16;
        const isCurrent = current?.id === p.id;
        return (
          <div
            key={p.id}
            className={`pawn ${isCurrent ? 'pawn-current' : ''}`}
            style={{
              gridRow: row,
              gridColumn: col,
              transform: `translate(${nudge}px, ${idx % 2 === 0 ? -2 : 10}px)`,
              borderColor: p.color,
            }}
            title={p.name}
          >
            {/* key berubah tiap langkah -> animasi hop re-trigger */}
            <span key={pos} className="pawn-emoji">
              {p.avatar.startsWith('data:') ? (
                <img className="pawn-img" src={p.avatar} alt={p.name} />
              ) : (
                p.avatar
              )}
            </span>
          </div>
        );
      })}

      {/* Pusat papan: dibuat lebih "rame" */}
      <div className="board-center">
        <div className="center-decks">
          <div className="deck deck-musibah">
            <div className="deck-icon">⚠️</div>
            <div className="deck-label">MUSIBAH</div>
          </div>
          <div className="deck deck-takdir">
            <div className="deck-icon">✨</div>
            <div className="deck-label">TAKDIR</div>
          </div>
        </div>

        <div className="board-center-title">WNI Simulator</div>
        <div className="board-center-sub">🇮🇩 Monopoli Nusantara</div>

        <div className="center-islands">
          {Object.entries(ISLAND_LABEL).map(([key, label]) => (
            <span
              key={key}
              className="island-chip"
              style={{ background: ISLAND_COLOR[key as keyof typeof ISLAND_COLOR] }}
            >
              {ISLAND_EMOJI[key]} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
