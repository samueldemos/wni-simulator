import { useState } from 'react';
import type { GameState } from '@wni/shared';
import type { GameSocket } from '../socket';

interface Props {
  socket: GameSocket;
  state: GameState | null;
  playerId: string | null;
  onError: (msg: string) => void;
}

export function Lobby({ socket, state, playerId, onError }: Props) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  const inRoom = !!state;

  const create = () => {
    if (!name.trim()) return onError('Isi nama dulu.');
    setBusy(true);
    socket.emit('room:create', { name }, (res) => {
      setBusy(false);
      if (!res.ok) onError(res.error ?? 'Gagal membuat room.');
    });
  };

  const join = () => {
    if (!name.trim()) return onError('Isi nama dulu.');
    if (!joinCode.trim()) return onError('Isi kode room.');
    setBusy(true);
    socket.emit('room:join', { roomCode: joinCode, name }, (res) => {
      setBusy(false);
      if (!res.ok) onError(res.error ?? 'Gagal bergabung.');
    });
  };

  const start = () => {
    socket.emit('game:start', (res) => {
      if (!res.ok) onError(res.error ?? 'Gagal memulai.');
    });
  };

  if (inRoom && state) {
    const me = state.players.find((p) => p.id === playerId);
    const isHost = me?.isHost;
    return (
      <div className="lobby">
        <div className="lobby-card">
          <h2>Ruang Tunggu</h2>
          <div className="roomcode">
            Kode Room: <strong>{state.roomCode}</strong>
          </div>
          <p className="hint">
            Bagikan kode ini ke teman-temanmu agar bisa bergabung.
          </p>
          <ul className="playerlist">
            {state.players.map((p) => (
              <li key={p.id}>
                <span className="dot" style={{ background: p.color }} />
                {p.name}
                {p.isHost && <span className="badge">Host</span>}
                {p.id === playerId && <span className="badge you">Kamu</span>}
              </li>
            ))}
          </ul>
          {isHost ? (
            <button
              className="btn primary"
              disabled={state.players.length < 2}
              onClick={start}
            >
              {state.players.length < 2
                ? 'Butuh minimal 2 pemain'
                : 'Mulai Permainan'}
            </button>
          ) : (
            <p className="hint">Menunggu host memulai permainan...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Selamat datang, calon WNI tersukses!</h2>
        <p className="hint">
          Monopoli bertema Indonesia. Beli kota, bangun properti, hindari
          korupsi (atau tidak 😏). Pemain terakhir yang bertahan menang.
        </p>
        <label>
          Nama kamu
          <input
            value={name}
            maxLength={20}
            placeholder="cth: Budi"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <button className="btn primary" disabled={busy} onClick={create}>
          Buat Room Baru
        </button>

        <div className="divider">atau</div>

        <label>
          Kode Room
          <input
            value={joinCode}
            maxLength={4}
            placeholder="cth: AB3K"
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
        </label>
        <button className="btn" disabled={busy} onClick={join}>
          Gabung Room
        </button>
      </div>
    </div>
  );
}
