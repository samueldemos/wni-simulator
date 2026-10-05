import { useEffect, useState } from 'react';
import {
  BOARD,
  ISLAND_COLOR,
  ISLAND_LABEL,
  LEVEL_ICON,
  LEVEL_LABEL,
  TOL_FEE,
  type GameState,
  type PropertyTile,
} from '@wni/shared';

interface Props {
  state: GameState;
}

function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

/**
 * Banner info petak tempat pemain giliran berhenti. Muncul saat posisi
 * pemain giliran berubah, lalu menghilang sendiri setelah beberapa detik.
 */
export function TileInfo({ state }: Props) {
  const current = state.players[state.currentPlayerIndex];
  const pos = current?.position ?? -1;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pos < 0) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(t);
  }, [pos, state.currentPlayerIndex]);

  if (!visible || pos < 0) return null;
  const tile = BOARD[pos];
  if (!tile) return null;

  // ---- Properti ----
  if (tile.type === 'property') {
    const pt = tile as PropertyTile;
    const prop = state.properties.find((p) => p.tileIndex === pos)!;
    const owner = prop.ownerId
      ? state.players.find((p) => p.id === prop.ownerId)
      : null;
    return (
      <div className="tileinfo" onClick={() => setVisible(false)}>
        <div
          className="tileinfo-stripe"
          style={{ background: ISLAND_COLOR[pt.island] }}
        />
        <div className="tileinfo-body">
          <div className="tileinfo-top">
            <span className="tileinfo-name">{pt.name}</span>
            <span className="tileinfo-island">{ISLAND_LABEL[pt.island]}</span>
          </div>
          <div className="tileinfo-rows">
            {owner ? (
              <>
                <span>
                  {LEVEL_ICON[prop.level]} {LEVEL_LABEL[prop.level]}
                </span>
                <span>
                  Milik <b>{owner.name}</b>
                </span>
                <span className="tileinfo-rent">
                  Sewa {rupiah(pt.rent[prop.level])}
                </span>
              </>
            ) : (
              <>
                <span>Belum dimiliki</span>
                <span className="tileinfo-rent">
                  Harga {rupiah(pt.price)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Petak khusus ----
  const special: Record<string, { icon: string; desc: string }> = {
    start: { icon: '🏁', desc: 'Terima gaji Rp 2.000.000 + jatah upgrade tanah.' },
    musibah: { icon: '⚠️', desc: 'Tarik Kartu Musibah. Semoga nggak apes.' },
    takdir: { icon: '✨', desc: 'Tarik Kartu Takdir. Hoki atau buntung?' },
    tax: { icon: '💸', desc: `Bayar ${rupiah((tile as { amount?: number }).amount ?? 0)} ke negara.` },
    jail: { icon: '🔒', desc: 'Cuma mampir (kecuali kamu memang dipenjara).' },
    'goto-jail': { icon: '🚔', desc: 'Terciduk! Langsung ke Rutan KPK.' },
    free: { icon: '☕', desc: 'Rehat ngopi dulu. Aman, nggak bayar apa-apa.' },
    tol: { icon: '🛣️', desc: `Bayar tol ${rupiah(TOL_FEE)} + WAJIB tembus ke tol lain.` },
  };
  const info = special[tile.type];
  if (!info) return null;

  return (
    <div className="tileinfo special" onClick={() => setVisible(false)}>
      <div className="tileinfo-body">
        <div className="tileinfo-top">
          <span className="tileinfo-name">
            {info.icon} {tile.name}
          </span>
        </div>
        <div className="tileinfo-rows">
          <span>{info.desc}</span>
        </div>
      </div>
    </div>
  );
}
