import { useEffect, useRef, useState } from 'react';
import type { Card, CardDeck, GameState } from '@wni/shared';
import { createSocket, type GameSocket } from './socket';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { CardModal } from './components/CardModal';

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

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('you:are', ({ playerId }) => setPlayerId(playerId));
    socket.on('state:update', (s) => setState(s));
    socket.on('chat:message', (m) => setChat((prev) => [...prev, m].slice(-100)));
    socket.on('card:drawn', (payload) => {
      setDrawnCard(payload);
      // auto-dismiss setelah 6 detik (atau pemain klik "Oke")
      window.setTimeout(() => setDrawnCard(null), 6000);
    });
    socket.on('error:msg', ({ message }) => {
      setError(message);
      window.setTimeout(() => setError(null), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const socket = socketRef.current;

  if (!socket) return null;

  const inGame = state && state.phase !== 'lobby';

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="flag">🇮🇩</span> WNI Simulator
        </h1>
        <div className={`conn ${connected ? 'on' : 'off'}`}>
          {connected ? 'Terhubung' : 'Menyambung...'}
        </div>
      </header>

      {error && <div className="toast error">{error}</div>}
      <CardModal drawn={drawnCard} onClose={() => setDrawnCard(null)} />

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
