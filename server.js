const express = require("express");
const http = require("http");
const path = require("path");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();

function makeState() {
  return {
    videoId: "",
    playing: false,
    currentTime: 0,
    playbackRate: 1,
    updatedAt: Date.now(),
    hostId: null
  };
}

function getProjectedTime(state) {
  if (!state.playing) return state.currentTime;
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  return state.currentTime + elapsed * state.playbackRate;
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { state: makeState(), clients: new Set() });
  }
  return rooms.get(roomId);
}

function broadcast(room, payload, skip = null) {
  const json = JSON.stringify(payload);
  for (const client of room.clients) {
    if (client.readyState !== 1 || client === skip) continue;
    client.send(json);
  }
}

function sendUserCount(room) {
  broadcast(room, { type: "user_count", count: room.clients.size });
}

function parseMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeUsername(name, fallback = "Wanderer") {
  if (typeof name !== "string") return fallback;
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  return trimmed.slice(0, 40);
}

function applyStatePatch(state, patch) {
  if (typeof patch.videoId === "string") state.videoId = patch.videoId.trim();
  if (typeof patch.playing === "boolean") state.playing = patch.playing;
  if (typeof patch.currentTime === "number" && Number.isFinite(patch.currentTime)) {
    state.currentTime = Math.max(0, patch.currentTime);
  }
  if (typeof patch.playbackRate === "number" && Number.isFinite(patch.playbackRate)) {
    state.playbackRate = patch.playbackRate;
  }
  state.updatedAt = Date.now();
}

wss.on("connection", (socket) => {
  let roomId = null;
  let clientId = null;

  socket.on("message", (raw) => {
    const msg = parseMessage(raw);
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "join") {
      if (typeof msg.roomId !== "string" || typeof msg.clientId !== "string") return;
      roomId = msg.roomId.trim();
      clientId = msg.clientId.trim();
      const username = sanitizeUsername(msg.username, `Wanderer-${clientId.slice(0, 4)}`);
      if (!roomId || !clientId) return;

      const room = getRoom(roomId);
      room.clients.add(socket);
      socket.clientId = clientId;
      socket.username = username;
      if (!room.state.hostId) room.state.hostId = clientId;

      socket.send(
        JSON.stringify({
          type: "room_state",
          hostId: room.state.hostId,
          userCount: room.clients.size,
          state: {
            videoId: room.state.videoId,
            playing: room.state.playing,
            currentTime: getProjectedTime(room.state),
            playbackRate: room.state.playbackRate,
            updatedAt: Date.now()
          }
        })
      );
      sendUserCount(room);
      return;
    }

    if (!roomId || !clientId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (msg.type === "set_host") {
      room.state.hostId = clientId;
      broadcast(room, { type: "host_changed", hostId: clientId });
      return;
    }

    if (msg.type === "sync") {
      if (room.state.hostId !== clientId) return;
      if (!msg.patch || typeof msg.patch !== "object") return;
      applyStatePatch(room.state, msg.patch);
      broadcast(
        room,
        {
          type: "sync",
          hostId: room.state.hostId,
          state: {
            videoId: room.state.videoId,
            playing: room.state.playing,
            currentTime: room.state.currentTime,
            playbackRate: room.state.playbackRate,
            updatedAt: room.state.updatedAt
          }
        },
        socket
      );
      return;
    }

    if (msg.type === "sync_request") {
      socket.send(
        JSON.stringify({
          type: "sync",
          hostId: room.state.hostId,
          state: {
            videoId: room.state.videoId,
            playing: room.state.playing,
            currentTime: getProjectedTime(room.state),
            playbackRate: room.state.playbackRate,
            updatedAt: Date.now()
          }
        })
      );
      return;
    }

    if (msg.type === "chat" && typeof msg.text === "string") {
      const text = msg.text.trim();
      if (!text) return;
      broadcast(room, {
        type: "chat",
        clientId,
        username: socket.username || `Wanderer-${clientId.slice(0, 4)}`,
        text: text.slice(0, 400),
        ts: Date.now()
      });
      return;
    }

    if (msg.type === "ping" && typeof msg.ts === "number") {
      socket.send(JSON.stringify({ type: "pong", ts: msg.ts }));
    }
  });

  socket.on("close", () => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    room.clients.delete(socket);
    if (room.state.hostId === clientId) {
      const nextClient = [...room.clients][0];
      room.state.hostId = nextClient ? nextClient.clientId : null;
      broadcast(room, { type: "host_changed", hostId: room.state.hostId });
    }

    if (room.clients.size > 0) sendUserCount(room);

    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  });
});

function listenWithFallback(startPort, maxAttempts = 10) {
  let port = startPort;
  let attempts = 0;

  const tryListen = () => {
    attempts += 1;
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  };

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && attempts < maxAttempts) {
      port += 1;
      console.warn(`Port in use. Retrying on ${port}...`);
      setTimeout(tryListen, 50);
      return;
    }
    console.error("Failed to start server:", err);
    process.exit(1);
  });

  tryListen();
}

listenWithFallback(DEFAULT_PORT);
