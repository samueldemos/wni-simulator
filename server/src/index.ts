// ============================================================
// WNI Simulator - Socket.IO server & room management.
// ============================================================
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  GameState,
  ServerToClientEvents,
} from '@wni/shared';
import {
  addPlayer,
  buyProperty,
  chooseUpgrade,
  createInitialState,
  currentPlayer,
  endTurn,
  payJail,
  rollDice,
  skipUpgrade,
  startGame,
  tolTeleport,
  useJailCard,
} from './engine.js';

// Railway/host memberi PORT via env; default 8080 (port umum container).
const PORT = Number(process.env.PORT ?? 8080);
// CLIENT_ORIGIN boleh berisi beberapa URL dipisah koma, atau "*" untuk semua.
const RAW_ORIGIN = process.env.CLIENT_ORIGIN ?? '*';
const CORS_ORIGIN: string | string[] =
  RAW_ORIGIN === '*'
    ? '*'
    : RAW_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.get('/', (_req, res) => res.send('WNI Simulator server is running.'));
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CORS_ORIGIN },
});

// roomCode -> state
const rooms = new Map<string, GameState>();
// socketId -> roomCode
const socketRoom = new Map<string, string>();

function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  } while (rooms.has(code));
  return code;
}

function broadcast(roomCode: string): void {
  const state = rooms.get(roomCode);
  if (state) io.to(roomCode).emit('state:update', state);
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name, avatar }, cb) => {
    const trimmed = (name ?? '').trim().slice(0, 20) || 'Pemain';
    const roomCode = genRoomCode();
    const state = createInitialState(roomCode);
    rooms.set(roomCode, state);
    addPlayer(state, socket.id, trimmed, avatar);
    socket.join(roomCode);
    socketRoom.set(socket.id, roomCode);
    socket.emit('you:are', { playerId: socket.id });
    cb({ ok: true, roomCode, playerId: socket.id });
    broadcast(roomCode);
  });

  socket.on('room:join', ({ roomCode, name, avatar }, cb) => {
    const code = (roomCode ?? '').trim().toUpperCase();
    const state = rooms.get(code);
    if (!state) return cb({ ok: false, error: 'Room tidak ditemukan.' });
    if (state.phase !== 'lobby')
      return cb({ ok: false, error: 'Permainan sudah dimulai.' });
    const trimmed = (name ?? '').trim().slice(0, 20) || 'Pemain';
    const player = addPlayer(state, socket.id, trimmed, avatar);
    if (!player) return cb({ ok: false, error: 'Room penuh.' });
    socket.join(code);
    socketRoom.set(socket.id, code);
    socket.emit('you:are', { playerId: socket.id });
    cb({ ok: true, roomCode: code, playerId: socket.id });
    broadcast(code);
  });

  const withRoom = (
    cb: ((res: { ok: boolean; error?: string }) => void) | undefined,
    fn: (state: GameState) => string | null,
  ) => {
    const code = socketRoom.get(socket.id);
    const state = code ? rooms.get(code) : undefined;
    if (!code || !state) {
      cb?.({ ok: false, error: 'Kamu belum ada di room.' });
      return;
    }
    const err = fn(state);
    if (err) {
      cb?.({ ok: false, error: err });
      socket.emit('error:msg', { message: err });
    } else {
      cb?.({ ok: true });
    }
    broadcast(code);
  };

  socket.on('game:start', (cb) => withRoom(cb, (s) => startGame(s, socket.id)));

  socket.on('turn:roll', (cb) =>
    withRoom(cb, (s) => {
      const { error, result } = rollDice(s, socket.id);
      if (error) return error;
      if (result?.drewCard) {
        const code = socketRoom.get(socket.id)!;
        io.to(code).emit('card:drawn', result.drewCard);
      }
      return null;
    }),
  );

  socket.on('turn:buy', (cb) => withRoom(cb, (s) => buyProperty(s, socket.id)));
  socket.on('upgrade:choose', ({ tileIndex }, cb) =>
    withRoom(cb, (s) => chooseUpgrade(s, socket.id, tileIndex)),
  );
  socket.on('upgrade:skip', (cb) =>
    withRoom(cb, (s) => skipUpgrade(s, socket.id)),
  );
  socket.on('tol:teleport', ({ tileIndex }, cb) =>
    withRoom(cb, (s) => tolTeleport(s, socket.id, tileIndex)),
  );
  socket.on('turn:end', (cb) => withRoom(cb, (s) => endTurn(s, socket.id)));
  socket.on('jail:pay', (cb) => withRoom(cb, (s) => payJail(s, socket.id)));
  socket.on('jail:useCard', (cb) =>
    withRoom(cb, (s) => useJailCard(s, socket.id)),
  );

  socket.on('chat:send', ({ text }) => {
    const code = socketRoom.get(socket.id);
    const state = code ? rooms.get(code) : undefined;
    if (!code || !state) return;
    const player = state.players.find((p) => p.id === socket.id);
    const clean = (text ?? '').trim().slice(0, 200);
    if (!player || !clean) return;
    io.to(code).emit('chat:message', {
      name: player.name,
      text: clean,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    const code = socketRoom.get(socket.id);
    socketRoom.delete(socket.id);
    const state = code ? rooms.get(code) : undefined;
    if (!code || !state) return;
    const player = state.players.find((p) => p.id === socket.id);
    if (!player) return;
    player.connected = false;
    // Jika masih di lobby, keluarkan pemain sepenuhnya.
    if (state.phase === 'lobby') {
      state.players = state.players.filter((p) => p.id !== socket.id);
      if (state.players.length === 0) {
        rooms.delete(code);
        return;
      }
      if (!state.players.some((p) => p.isHost)) state.players[0].isHost = true;
    } else {
      // Saat bermain: tandai disconnect; jika gilirannya, lewati.
      if (currentPlayer(state).id === socket.id) {
        endTurn(state, socket.id);
      }
    }
    broadcast(code);
  });
});

// Bind ke 0.0.0.0 agar bisa dijangkau dari luar container (Railway/Render).
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🇮🇩 WNI Simulator server berjalan di 0.0.0.0:${PORT}`);
});
