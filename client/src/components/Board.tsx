import {
  BOARD,
  ISLAND_COLOR,
  type GameState,
  type PropertyTile,
  type Tile,
} from '@wni/shared';

interface Props {
  state: GameState;
}

// Board is 28 tiles = 8 per side sharing corners (0,7,14,21 corners => actually
// our board has 28 tiles; arrange as 8x8 ring: 8 top, 8 right... we use a
// generic ring layout computing grid position per index for a 8-per-side ring).

// We render a ring on an 8x8 CSS grid. 28 tiles => 8 bottom + 7 left + 8 top + 7 right? 
// Simpler: compute perimeter positions for N tiles on a square grid.

const SIDE = 8; // 8x8 grid -> perimeter = 28 cells. Perfect for 28 tiles.

function gridPos(index: number): { row: number; col: number } {
  // Perimeter walk starting bottom-right going counter-clockwise (Monopoly style:
  // START bottom-right corner, moving left along the bottom).
  const n = index;
  if (n <= 7) {
    // bottom row: right -> left (col 8..1), row 8
    return { row: SIDE, col: SIDE - n };
  } else if (n <= 14) {
    // left column: bottom -> top (row 8..1), col 1
    return { row: SIDE - (n - 7), col: 1 };
  } else if (n <= 21) {
    // top row: left -> right (col 1..8), row 1
    return { row: 1, col: 1 + (n - 14) };
  } else {
    // right column: top -> bottom (row 1..8), col 8
    return { row: 1 + (n - 21), col: SIDE };
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
      return 'PARKIR';
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
      return '🅿️';
    case 'property':
      return '🏙️';
  }
}

export function Board({ state }: Props) {
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
        const here = state.players.filter(
          (p) => p.position === tile.index && !p.bankrupt,
        );
        const isProperty = tile.type === 'property';
        const islandColor = isProperty
          ? ISLAND_COLOR[(tile as PropertyTile).island]
          : undefined;

        return (
          <div
            key={tile.index}
            className={`tile tile-${tile.type}`}
            style={{ gridRow: row, gridColumn: col }}
          >
            {isProperty && (
              <div
                className="tile-band"
                style={{ background: islandColor }}
              />
            )}
            {!isProperty && <div className="tile-icon">{tileIcon(tile)}</div>}
            <div className="tile-name">{tileLabel(tile)}</div>
            {isProperty && (
              <div className="tile-price">
                {(tile as PropertyTile).price.toLocaleString('id-ID')}
              </div>
            )}
            {prop && prop.houses > 0 && (
              <div className="tile-houses">
                {prop.houses === 5 ? '🏨' : '🏠'.repeat(prop.houses)}
              </div>
            )}
            {owner && (
              <div
                className="tile-owner"
                style={{ background: owner.color }}
                title={`Milik ${owner.name}`}
              />
            )}
            {here.length > 0 && (
              <div className="tile-tokens">
                {here.map((p) => (
                  <span
                    key={p.id}
                    className="token"
                    style={{ background: p.color }}
                    title={p.name}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="board-center">
        <div className="board-center-title">WNI Simulator</div>
        <div className="board-center-sub">🇮🇩 Monopoli Nusantara</div>
      </div>
    </div>
  );
}
