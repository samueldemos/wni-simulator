import { useEffect, useRef, useState } from 'react';
import {
  BOARD,
  ISLAND_COLOR,
  ISLAND_LABEL,
  ISLAND_ORDER,
  LEVEL_ICON,
  LEVEL_LABEL,
  TOL_INDICES,
  type GameState,
  type PropertyLevel,
  type PropertyTile,
} from '@wni/shared';
import type { GameSocket } from '../socket';
import type { ChatMessage } from '../App';
import { Board } from './Board';
import { Dice } from './Dice';
import { AnimatedMoney } from './AnimatedMoney';
import { Avatar } from './Avatar';
import { TileInfo } from './TileInfo';
import { sfx } from '../sound';

interface Props {
  socket: GameSocket;
  state: GameState;
  playerId: string | null;
  chat: ChatMessage[];
  diceRolling: boolean;
}

function rupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function Game({ socket, state, playerId, chat, diceRolling }: Props) {
  const [chatInput, setChatInput] = useState('');
  const [sentRoll, setSentRoll] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const me = state.players.find((p) => p.id === playerId);
  const current = state.players[state.currentPlayerIndex];
  const myTurn = current?.id === playerId;
  const myTile = me ? BOARD[me.position] : null;
  const myProp =
    myTile?.type === 'property'
      ? state.properties.find((p) => p.tileIndex === myTile.index)
      : undefined;

  // Reset "sentRoll" saat animasi dadu dimulai (alur normal).
  useEffect(() => {
    if (diceRolling) setSentRoll(false);
  }, [diceRolling]);

  // Pengaman anti-nyangkut: apa pun yang terjadi, "sentRoll" dibatalkan paling
  // lama 2,5 detik setelah klik, supaya tombol tidak terkunci "MELEMPAR..."
  // (mis. pada giliran ulang akibat dadu kembar).
  useEffect(() => {
    if (!sentRoll) return;
    const t = window.setTimeout(() => setSentRoll(false), 2500);
    return () => window.clearTimeout(t);
  }, [sentRoll]);

  // Auto-scroll chat ke bawah.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  const canBuy =
    myTurn &&
    state.turnStage === 'awaiting-action' &&
    myTile?.type === 'property' &&
    myProp?.ownerId == null &&
    me &&
    me.money >= (myTile as PropertyTile).price;

  const roll = () => {
    setSentRoll(true);
    sfx.dice();
    socket.emit('turn:roll', () => {});
  };
  const buy = () => socket.emit('turn:buy', () => {});
  const end = () => socket.emit('turn:end', () => {});
  const payJail = () => socket.emit('jail:pay', () => {});
  const useCard = () => socket.emit('jail:useCard', () => {});
  const chooseUpgrade = (tileIndex: number) =>
    socket.emit('upgrade:choose', { tileIndex }, () => {});
  const skipUpgrade = () => socket.emit('upgrade:skip', () => {});
  const tolTeleport = (tileIndex: number) =>
    socket.emit('tol:teleport', { tileIndex }, () => {});

  const sendChat = () => {
    const t = chatInput.trim();
    if (!t) return;
    socket.emit('chat:send', { text: t });
    setChatInput('');
  };

  // biaya upgrade ke level berikutnya (null jika sudah OKB)
  const nextUpgradeCost = (
    tileIndex: number,
    level: PropertyLevel,
  ): number | null => {
    const tile = BOARD[tileIndex] as PropertyTile;
    if (level === 0) return tile.upgradeCost[0];
    if (level === 1) return tile.upgradeCost[1];
    return null;
  };

  // properti milikku yang bisa di-upgrade (dipakai saat jatah lewat START aktif)
  const myUpgradable = state.properties.filter(
    (p) => p.ownerId === playerId && p.level < 2,
  );

  const needUpgrade = state.pendingUpgradeFor === playerId;
  const needTol = state.pendingTolFor === playerId;

  // Properti milikku, dikelompokkan per pulau (untuk panel "Propertiku").
  const myProps = state.properties
    .filter((p) => p.ownerId === playerId)
    .map((p) => ({ state: p, tile: BOARD[p.tileIndex] as PropertyTile }));

  const myPropsByIsland = ISLAND_ORDER.map((island) => {
    const all = BOARD.filter(
      (t): t is PropertyTile => t.type === 'property' && t.island === island,
    );
    const owned = myProps.filter((m) => m.tile.island === island);
    return { island, owned, total: all.length };
  }).filter((g) => g.owned.length > 0);

  // Aksi utama untuk floating bar HP (satu tombol paling relevan).
  const canRoll = myTurn && state.turnStage === 'awaiting-roll' && !needTol;
  const canEnd =
    myTurn &&
    state.turnStage !== 'awaiting-roll' &&
    !needUpgrade &&
    !needTol;

  return (
    <div className="game">
      <TileInfo state={state} />

      <div className="game-main">
        <Board state={state} />
      </div>

      <aside className="sidebar">
        {/* Pemain */}
        <section className="panel">
          <h3>Pemain</h3>
          <ul className="players">
            {state.players.map((p) => (
              <li
                key={p.id}
                className={
                  (p.id === current?.id ? 'active ' : '') +
                  (p.bankrupt ? 'bankrupt' : '')
                }
              >
                <Avatar avatar={p.avatar} color={p.color} title={p.name} />
                <span className="pname">
                  {p.name}
                  {p.id === playerId && ' (kamu)'}
                </span>
                <span className="pmoney">
                  <AnimatedMoney value={p.money} />
                </span>
                {p.inJail && <span className="jailtag">🔒</span>}
                {p.bankrupt && <span className="jailtag">💀</span>}
              </li>
            ))}
          </ul>
          {state.pot > 0 && (
            <div className="pot">💰 Kas Negara: {rupiah(state.pot)}</div>
          )}
        </section>

        {/* Aksi */}
        <section className="panel">
          <h3>
            {state.phase === 'finished'
              ? '🎉 Permainan Selesai'
              : myTurn
                ? 'Giliranmu!'
                : `Giliran ${current?.name}`}
          </h3>

          {state.phase === 'finished' && state.winnerId && (
            <div className="winner">
              🏆 Pemenang:{' '}
              <strong>
                {state.players.find((p) => p.id === state.winnerId)?.name}
              </strong>
            </div>
          )}

          {(state.lastDice || diceRolling || sentRoll) && (
            <Dice
              values={state.lastDice}
              rolling={diceRolling || sentRoll}
            />
          )}

          {state.phase === 'playing' && myTurn && me && (
            <div className="actions">
              {me.inJail && state.turnStage === 'awaiting-roll' && (
                <>
                  <div className="jail-note">
                    Kamu di penjara. Lempar dadu kembar untuk bebas, atau:
                  </div>
                  <button
                    className="btn"
                    disabled={me.money < 1_000_000}
                    onClick={payJail}
                  >
                    Bayar Jaminan {rupiah(1_000_000)}
                  </button>
                  {me.getOutOfJailCards > 0 && (
                    <button className="btn" onClick={useCard}>
                      Pakai Kartu Bebas Penjara ({me.getOutOfJailCards})
                    </button>
                  )}
                </>
              )}

              {state.turnStage === 'awaiting-roll' && (
                <button
                  className="btn primary"
                  disabled={sentRoll || diceRolling}
                  onClick={roll}
                >
                  🎲 {sentRoll || diceRolling ? 'Melempar...' : 'Lempar Dadu'}
                </button>
              )}

              {canBuy && myTile?.type === 'property' && (
                <button className="btn primary" onClick={buy}>
                  Caplok {myTile.name} ({rupiah((myTile as PropertyTile).price)})
                </button>
              )}

              {needUpgrade && (
                <div className="jail-note">
                  🏗️ Kamu lewat START, pilih 1 tanah untuk di-upgrade (lihat
                  jendela).
                </div>
              )}
              {needTol && (
                <div className="jail-note">
                  🛣️ Kamu di Jalan Tol, pilih mau tembus ke tol mana (lihat
                  jendela).
                </div>
              )}

              {state.turnStage !== 'awaiting-roll' && (
                <button
                  className="btn"
                  disabled={needUpgrade || needTol}
                  onClick={end}
                >
                  Akhiri Giliran
                </button>
              )}
            </div>
          )}

          {state.phase === 'playing' && !myTurn && (
            <div className="hint">Menunggu giliran {current?.name}...</div>
          )}
        </section>

        {/* Propertiku */}
        <section className="panel">
          <h3>Propertiku ({myProps.length})</h3>
          {myProps.length === 0 ? (
            <div className="hint">
              Belum punya properti. Caplok kota saat berhenti di petaknya!
            </div>
          ) : (
            <div className="myprops">
              {myPropsByIsland.map((g) => (
                <div key={g.island} className="myprops-group">
                  <div
                    className="myprops-island"
                    style={{ color: ISLAND_COLOR[g.island] }}
                  >
                    <span
                      className="myprops-dot"
                      style={{ background: ISLAND_COLOR[g.island] }}
                    />
                    {ISLAND_LABEL[g.island]}
                    <span className="myprops-count">
                      {g.owned.length}/{g.total}
                      {g.owned.length === g.total && ' 👑'}
                    </span>
                  </div>
                  {g.owned.map(({ state: ps, tile }) => (
                    <div key={ps.tileIndex} className="myprops-item">
                      <span className="myprops-level" title={LEVEL_LABEL[ps.level]}>
                        {LEVEL_ICON[ps.level]}
                      </span>
                      <span className="myprops-name">{tile.name}</span>
                      <span className="myprops-rent">
                        sewa {rupiah(tile.rent[ps.level])}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Log */}
        <section className="panel log-panel">
          <h3>Riwayat</h3>
          <div className="log">
            {[...state.log]
              .slice(-30)
              .reverse()
              .map((l) => (
                <div key={l.id} className="log-line">
                  {l.text}
                </div>
              ))}
          </div>
        </section>

        {/* Chat */}
        <section className="panel chat-panel">
          <h3>Obrolan</h3>
          <div className="chat">
            {chat.map((m, i) => (
              <div key={i} className="chat-line">
                <strong>{m.name}:</strong> {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input">
            <input
              value={chatInput}
              placeholder="Ketik pesan..."
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            />
            <button className="btn small" onClick={sendChat}>
              Kirim
            </button>
          </div>
        </section>
      </aside>

      {/* Dialog: pilih tanah untuk di-upgrade (jatah lewat START) */}
      {needUpgrade && me && (
        <div className="choice-overlay">
          <div className="choice-box">
            <h3>🏗️ Jatah Upgrade (lewat START)</h3>
            <p className="hint">
              Pilih 1 propertimu untuk naik level. Tanah Kosong → Rumah Subsidi
              → Rumah OKB.
            </p>
            <div className="choice-list">
              {myUpgradable.map((p) => {
                const tile = BOARD[p.tileIndex] as PropertyTile;
                const cost = nextUpgradeCost(p.tileIndex, p.level);
                const nextLvl = (p.level + 1) as PropertyLevel;
                const afford = cost !== null && me.money >= cost;
                return (
                  <button
                    key={p.tileIndex}
                    className="choice-item"
                    disabled={!afford}
                    onClick={() => chooseUpgrade(p.tileIndex)}
                  >
                    <span className="choice-item-name">{tile.name}</span>
                    <span className="choice-item-sub">
                      {LEVEL_ICON[p.level]} {LEVEL_LABEL[p.level]} →{' '}
                      {LEVEL_ICON[nextLvl]} {LEVEL_LABEL[nextLvl]}
                    </span>
                    <span className="choice-item-cost">
                      {cost !== null ? rupiah(cost) : 'Maks'}
                    </span>
                  </button>
                );
              })}
              {myUpgradable.length === 0 && (
                <p className="hint">Tidak ada properti yang bisa di-upgrade.</p>
              )}
            </div>
            <button className="btn" onClick={skipUpgrade}>
              Lewati
            </button>
          </div>
        </div>
      )}

      {/* Dialog: Jalan Tol teleport (WAJIB pindah, bayar lagi 500K) */}
      {needTol && me && (
        <div className="choice-overlay">
          <div className="choice-box">
            <h3>🛣️ Pintu Tol</h3>
            <p className="hint">
              Masuk tol WAJIB tembus ke Pintu Tol lain. Pilih tujuan, kena{' '}
              <b>biaya tol lagi {rupiah(500_000)}</b>. Nggak ada jalan putar
              balik. 😩
            </p>
            <div className="choice-list">
              {TOL_INDICES.filter((i) => i !== me.position).map((i) => (
                <button
                  key={i}
                  className="choice-item"
                  onClick={() => tolTeleport(i)}
                >
                  <span className="choice-item-name">{BOARD[i].name}</span>
                  <span className="choice-item-sub">🛣️ tembus ke sini</span>
                  <span className="choice-item-cost">{rupiah(500_000)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating action bar — HANYA tampil di HP (lihat CSS) */}
      {state.phase === 'playing' && me && (
        <div className="fab">
          {!myTurn && (
            <div className="fab-wait">
              <Avatar avatar={current?.avatar ?? ''} color={current?.color ?? '#000'} />
              Giliran {current?.name}...
            </div>
          )}
          {myTurn && (
            <>
              {me.inJail && state.turnStage === 'awaiting-roll' && (
                <button
                  className="btn"
                  disabled={me.money < 1_000_000}
                  onClick={payJail}
                >
                  Jaminan {rupiah(1_000_000)}
                </button>
              )}
              {canRoll && (
                <button
                  className="btn primary"
                  disabled={sentRoll || diceRolling}
                  onClick={roll}
                >
                  🎲 {sentRoll || diceRolling ? 'Melempar...' : 'Lempar Dadu'}
                </button>
              )}
              {canBuy && myTile?.type === 'property' && (
                <button className="btn primary" onClick={buy}>
                  Caplok ({rupiah((myTile as PropertyTile).price)})
                </button>
              )}
              {needUpgrade && (
                <div className="fab-wait">🏗️ Pilih tanah di jendela upgrade</div>
              )}
              {needTol && (
                <div className="fab-wait">🛣️ Pilih tujuan tol di jendela</div>
              )}
              {canEnd && !canBuy && (
                <button className="btn" onClick={end}>
                  Akhiri Giliran
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
