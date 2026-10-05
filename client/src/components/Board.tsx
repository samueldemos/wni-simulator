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

const SIDE = 8; // 8x8 grid -> perimeter = 28 cells.

function gridPos(index: number): { row: number; col: number } {
  const n = index;
  if (n <= 7) {
    return { row: SIDE, col: SIDE - n }; // bottom: right -> left
  } else if (n <= 14) {
    return { row: SIDE - (n - 7), col: 1 }; // left: bottom -> top
  } else if (n <= 21) {
    return { row: 1, col: 1 + (n - 14) }; // top: left -> right
  } else {
    return { row: 1 + (n - 21), col: SIDE }; // right: top -> bottom
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
  const current = state.players[state.currentPlayerIndex];

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
          </div>
        );
      })}

      {/* Bidak pemain: absolute agar bisa animasi gerak mulus */}
      {state.players
        .filter((p) => !p.bankrupt)
        .map((p) => {
          const { row, col } = gridPos(p.position);
          // offset kecil supaya beberapa bidak di petak sama tidak tumpuk persis
          const sameTile = state.players.filter(
            (x) => !x.bankrupt && x.position === p.position,
          );
          const idx = sameTile.findIndex((x) => x.id === p.id);
          const nudge = idx * 18;
          return (
            <div
              key={p.id}
              className="pawn"
              style={{
                gridRow: row,
                gridColumn: col,
                transform: `translate(${nudge}px, ${idx % 2 === 0 ? 0 : 10}px)`,
                borderColor: p.color,
              }}
              title={p.name}
            >
              <span className="pawn-emoji">{p.avatar}</span>
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
