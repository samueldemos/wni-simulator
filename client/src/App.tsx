import { useEffect, useRef, useState } from 'react';
import type { Card, CardDeck, GameState } from '@wni/shared';
import { createSocket, type GameSocket } from './socket';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { CardModal } from './components/CardModal';
import {
  FloatingReactions,
  useReactions,
} from './components/FloatingReactions';
import { sfx, setSoundEnabled, isSoundEnabled } from './sound';

export interface ChatMessage {
  name: string;
  text: string;
  ts: number;
}

export interface DrawnCard {
  deck: CardDeck;
  card: Card;
}

export function App() {
  const socketRef = useRef<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const { reactions, spawn } = useReactions();
  const prevRef = useRef<GameState | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('you:are', ({ playerId }) => setPlayerId(playerId));
    socket.on('state:update', (s) => setState(s));
    socket.on('chat:message', (m) => setChat((prev) => [...prev, m].slice(-100)));
    socket.on('card:drawn', (payload) => {
      sfx.card();
      setDrawnCard(payload);
      window.setTimeout(() => setDrawnCard(null), 6500);
    });
    socket.on('error:msg', ({ message }) => {
      setError(message);
      window.setTimeout(() => setError(null), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Deteksi perubahan state untuk memicu suara & reaksi emoji.
  useEffect(() => {
    if (!state) return;
    const prev = prevRef.current;
    prevRef.current = state;
    if (!prev) return;

    // menang
    if (state.winnerId && !prev.winnerId) {
      sfx.win();
      spawn('🏆', 6);
    }

    for (const p of state.players) {
      const old = prev.players.find((x) => x.id === p.id);
      if (!old) continue;

      // perubahan uang
      const diff = p.money - old.money;
      if (diff > 0) {
        sfx.cash();
        spawn('💰', diff > 2_000_000 ? 4 : 2);
      } else if (diff < 0) {
        sfx.pay();
        spawn(diff < -1_500_000 ? '😭' : '💸', 2);
      }

      // baru masuk penjara
      if (p.inJail && !old.inJail) {
        sfx.jail();
        spawn('🚔', 3);
        spawn('⛓️', 1);
      }

      // baru bangkrut
      if (p.bankrupt && !old.bankrupt) {
        spawn('💀', 3);
      }
    }

    // properti baru dibeli
    const newlyOwned = state.properties.filter((pr) => {
      const o = prev.properties.find((x) => x.tileIndex === pr.tileIndex);
      return o && o.ownerId === null && pr.ownerId !== null;
    });
    if (newlyOwned.length > 0) {
      sfx.buy();
      spawn('🏠', 2);
    }
  }, [state, spawn]);

  const socket = socketRef.current;
  if (!socket) return null;

  const inGame = state && state.phase !== 'lobby';

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) sfx.card(); // bunyi konfirmasi
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="flag">🇮🇩</span> WNI Simulator
        </h1>
        <div className="topbar-right">
          <button
            className="sound-toggle"
            onClick={toggleSound}
            title={soundOn ? 'Matikan suara' : 'Nyalakan suara'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <div className={`conn ${connected ? 'on' : 'off'}`}>
            {connected ? 'Terhubung' : 'Menyambung...'}
          </div>
        </div>
      </header>

      {error && <div className="toast error">{error}</div>}
      <CardModal drawn={drawnCard} onClose={() => setDrawnCard(null)} />
      <FloatingReactions reactions={reactions} />

      {!state || state.phase === 'lobby' ? (
        <Lobby
          socket={socket}
          state={state}
          playerId={playerId}
          onError={setError}
        />
      ) : null}

      {inGame && state && (
        <Game socket={socket} state={state} playerId={playerId} chat={chat} />
      )}
    </div>
  );
}
