import { useEffect, useRef, useState } from 'react';
import { BOARD, type GameState, type PropertyTile } from '@wni/shared';
import type { GameSocket } from '../socket';
import type { ChatMessage } from '../App';
import { Board } from './Board';
import { Dice } from './Dice';
import { AnimatedMoney } from './AnimatedMoney';
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

  // Reset "sentRoll" begitu animasi dadu benar-benar dimulai (dikontrol sequencer).
  useEffect(() => {
    if (diceRolling) setSentRoll(false);
  }, [diceRolling]);

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
  const build = (tileIndex: number) =>
    socket.emit('turn:build', { tileIndex }, () => {});

  const sendChat = () => {
    const t = chatInput.trim();
    if (!t) return;
    socket.emit('chat:send', { text: t });
    setChatInput('');
  };

  const myBuildable = state.properties.filter((p) => {
    if (p.ownerId !== playerId) return false;
    const tile = BOARD[p.tileIndex] as PropertyTile;
    const group = BOARD.filter(
      (t): t is PropertyTile => t.type === 'property' && t.island === tile.island,
    );
    const ownsAll = group.every(
      (t) =>
        state.properties.find((x) => x.tileIndex === t.index)?.ownerId ===
        playerId,
    );
    return ownsAll && p.houses < 5;
  });

  return (
    <div className="game">
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
                <span className="avatar" style={{ borderColor: p.color }}>
                  {p.avatar}
                </span>
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
                  Beli {myTile.name} ({rupiah((myTile as PropertyTile).price)})
                </button>
              )}

              {state.turnStage !== 'awaiting-roll' && (
                <button className="btn" onClick={end}>
                  Akhiri Giliran
                </button>
              )}

              {myBuildable.length > 0 &&
                state.turnStage !== 'awaiting-roll' && (
                  <div className="build-section">
                    <div className="build-title">Bangun properti:</div>
                    {myBuildable.map((p) => {
                      const tile = BOARD[p.tileIndex] as PropertyTile;
                      return (
                        <button
                          key={p.tileIndex}
                          className="btn small"
                          disabled={!me || me.money < tile.houseCost}
                          onClick={() => build(p.tileIndex)}
                        >
                          {tile.name} +{p.houses === 4 ? '🏨' : '🏠'} (
                          {rupiah(tile.houseCost)})
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {state.phase === 'playing' && !myTurn && (
            <div className="hint">Menunggu giliran {current?.name}...</div>
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
    </div>
  );
}
