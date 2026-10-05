import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useGameSequencer } from './useGameSequencer';

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
  const [rawState, setRawState] = useState<GameState | null>(null);
  const [rawCard, setRawCard] = useState<DrawnCard | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
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
    socket.on('state:update', (s) => setRawState(s));
    socket.on('chat:message', (m) =>
      setChat((prev) => [...prev, m].slice(-100)),
    );
    socket.on('card:drawn', (payload) => setRawCard(payload));
    socket.on('error:msg', ({ message }) => {
      setError(message);
      window.setTimeout(() => setError(null), 3500);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearRawCard = useCallback(() => setRawCard(null), []);

  // Sequencer: menahan state & kartu agar animasi berurutan & santai.
  const { presented, card, closeCard, diceRolling } = useGameSequencer(
    rawState,
    rawCard,
    clearRawCard,
  );

  // Suara + reaksi emoji dipicu dari state YANG DITAMPILKAN (presented),
  // jadi efek muncul pas bidak sudah sampai, bukan saat data mentah tiba.
  useEffect(() => {
    if (!presented) return;
    const prev = prevRef.current;
    prevRef.current = presented;
    if (!prev) return;

    if (presented.winnerId && !prev.winnerId) {
      sfx.win();
      spawn('🏆', 6);
    }

    for (const p of presented.players) {
      const old = prev.players.find((x) => x.id === p.id);
      if (!old) continue;

      const diff = p.money - old.money;
      if (diff > 0) {
        sfx.cash();
        spawn('💰', diff > 2_000_000 ? 4 : 2);
      } else if (diff < 0) {
        sfx.pay();
        spawn(diff < -1_500_000 ? '😭' : '💸', 2);
      }

      if (p.inJail && !old.inJail) {
        sfx.jail();
        spawn('🚔', 3);
        spawn('⛓️', 1);
      }
      if (p.bankrupt && !old.bankrupt) spawn('💀', 3);
    }

    const bought = presented.properties.some((pr) => {
      const o = prev.properties.find((x) => x.tileIndex === pr.tileIndex);
      return o && o.ownerId === null && pr.ownerId !== null;
    });
    if (bought) {
      sfx.buy();
      spawn('🏠', 2);
    }
  }, [presented, spawn]);

  // bunyi saat kartu benar-benar muncul
  useEffect(() => {
    if (card) sfx.card();
  }, [card]);

  const socket = socketRef.current;
  if (!socket) return null;

  const inGame = presented && presented.phase !== 'lobby';

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) sfx.card();
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
      <CardModal drawn={card} onClose={closeCard} />
      <FloatingReactions reactions={reactions} />

      {!presented || presented.phase === 'lobby' ? (
        <Lobby
          socket={socket}
          state={presented}
          playerId={playerId}
          onError={setError}
        />
      ) : null}

      {inGame && presented && (
        <Game
          socket={socket}
          state={presented}
          playerId={playerId}
          chat={chat}
          diceRolling={diceRolling}
        />
      )}
    </div>
  );
}
