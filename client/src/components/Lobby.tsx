import { useRef, useState } from 'react';
import { AVATAR_OPTIONS, type GameState } from '@wni/shared';
import type { GameSocket } from '../socket';
import { Avatar } from './Avatar';
import { HeroArt } from './HeroArt';
import { fileToAvatarDataUrl } from '../imageUtil';

interface Props {
  socket: GameSocket;
  state: GameState | null;
  playerId: string | null;
  onError: (msg: string) => void;
}

export function Lobby({ socket, state, playerId, onError }: Props) {
  const [screen, setScreen] = useState<'landing' | 'form'>('landing');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0].emoji);
  const [photo, setPhoto] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const inRoom = !!state;
  const chosenAvatar = photo ?? avatar;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file, 96);
      setPhoto(dataUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Gagal memuat foto.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const create = () => {
    if (!name.trim()) return onError('Isi nama dulu.');
    setBusy(true);
    socket.emit('room:create', { name, avatar: chosenAvatar }, (res) => {
      setBusy(false);
      if (!res.ok) onError(res.error ?? 'Gagal membuat room.');
    });
  };

  const join = () => {
    if (!name.trim()) return onError('Isi nama dulu.');
    if (!joinCode.trim()) return onError('Isi kode room.');
    setBusy(true);
    socket.emit(
      'room:join',
      { roomCode: joinCode, name, avatar: chosenAvatar },
      (res) => {
        setBusy(false);
        if (!res.ok) onError(res.error ?? 'Gagal bergabung.');
      },
    );
  };

  const start = () => {
    socket.emit('game:start', (res) => {
      if (!res.ok) onError(res.error ?? 'Gagal memulai.');
    });
  };

  // ---------- Ruang tunggu (sudah di room) ----------
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
                <Avatar avatar={p.avatar} color={p.color} title={p.name} />
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

  // ---------- Landing page ----------
  if (screen === 'landing') {
    return (
      <div className="landing">
        <div className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge">
              Berita baik, kamu dapat kesempatan jadi WNI
            </div>
            <h1 className="landing-title">
              WNI Simulator
              <span className="accent">Nusantara Kacau!</span>
            </h1>
            <p className="landing-tagline">
              Caplok tanah dari Papua sampai Jawa, tarik kartu <b>Musibah</b>{' '}
              &amp; <b>Takdir</b> yang bikin ngakak, dan hati-hati{' '}
              <b>ketahuan korupsi</b>: kena OTT KPK, harta disita negara! 😏
            </p>

            <div className="landing-info">
              <div className="landing-info-cell">
                <div className="landing-info-label">Pemain</div>
                <div className="landing-info-value">2 - 6 orang</div>
              </div>
              <div className="landing-info-cell">
                <div className="landing-info-label">Biaya</div>
                <div className="landing-info-value">Gratis</div>
              </div>
            </div>

            <button
              className="btn primary landing-cta"
              onClick={() => setScreen('form')}
            >
              <span>🎮 Main Sekarang</span>
              <span className="cta-arrow">→</span>
            </button>
            <p className="landing-foot">
              Tanpa install. Buat room, bagikan kode, main bareng teman.
            </p>
          </div>

          <HeroArt />
        </div>
      </div>
    );
  }

  // ---------- Form buat / gabung ----------
  return (
    <div className="lobby">
      <div className="lobby-card">
        <button className="link-back" onClick={() => setScreen('landing')}>
          ← kembali
        </button>
        <h2>Siapkan karaktermu</h2>

        {/* Preview avatar terpilih */}
        <div className="avatar-preview">
          <Avatar avatar={chosenAvatar} color="#121212" size={72} />
          <div className="avatar-preview-label">
            {photo
              ? 'Foto kamu'
              : AVATAR_OPTIONS.find((o) => o.emoji === avatar)?.label}
          </div>
        </div>

        <label>Pilih karakter</label>
        <div className="avatar-picker">
          {AVATAR_OPTIONS.map((o) => (
            <button
              key={o.emoji}
              type="button"
              title={o.label}
              className={`avatar-choice ${
                !photo && avatar === o.emoji ? 'selected' : ''
              }`}
              onClick={() => {
                setAvatar(o.emoji);
                setPhoto(null);
              }}
            >
              {o.emoji}
            </button>
          ))}
        </div>

        <div className="photo-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onPickFile}
          />
          <button
            type="button"
            className="btn small"
            onClick={() => fileRef.current?.click()}
          >
            📷 Upload Foto
          </button>
          {photo && (
            <button
              type="button"
              className="btn small"
              onClick={() => setPhoto(null)}
            >
              ✕ Hapus Foto
            </button>
          )}
        </div>

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
