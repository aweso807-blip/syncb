const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const viewerProfiles = new Map();
const shows = new Map();
const hostSubscribers = new Map();
const alerts = [];

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

function sanitizeText(value, fallback = "", max = 120) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function sanitizeUsername(name, fallback = "Wanderer") {
  return sanitizeText(name, fallback, 40);
}

function sanitizeRoomId(value) {
  const roomId = sanitizeText(value, "", 50).toLowerCase();
  return roomId.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function sanitizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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

function ensureViewer(clientId, username = "") {
  const safeClientId = sanitizeText(clientId, "", 80);
  if (!safeClientId) return null;
  const existing = viewerProfiles.get(safeClientId);
  if (existing) {
    if (username) existing.displayName = sanitizeUsername(username, existing.displayName);
    return existing;
  }

  const viewer = {
    clientId: safeClientId,
    displayName: sanitizeUsername(username, `Viewer-${safeClientId.slice(0, 4)}`),
    email: "",
    whatsapp: "",
    notificationPrefs: {
      alerts: true,
      email: false,
      whatsapp: false
    },
    channelName: "",
    channelTagline: "",
    createdAt: new Date().toISOString()
  };
  viewerProfiles.set(safeClientId, viewer);
  return viewer;
}

function getSubscribers(hostId) {
  if (!hostSubscribers.has(hostId)) hostSubscribers.set(hostId, new Set());
  return hostSubscribers.get(hostId);
}

function toShowResponse(show) {
  const host = viewerProfiles.get(show.hostId);
  return {
    id: show.id,
    title: show.title,
    description: show.description,
    roomId: show.roomId,
    videoId: show.videoId,
    scheduledFor: show.scheduledFor,
    durationMinutes: show.durationMinutes,
    hostId: show.hostId,
    channelName: host?.channelName || host?.displayName || "Host"
  };
}

function buildAppState(viewer) {
  const subscriptions = [...hostSubscribers.entries()]
    .filter(([, subscribers]) => subscribers.has(viewer.clientId))
    .map(([hostId]) => hostId);

  const upcomingShows = [...shows.values()]
    .filter((show) => new Date(show.scheduledFor).getTime() >= Date.now() - 15 * 60000)
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  const channels = [...viewerProfiles.values()]
    .filter((profile) => profile.channelName)
    .map((profile) => ({
      id: profile.clientId,
      displayName: profile.displayName,
      channelName: profile.channelName,
      channelTagline: profile.channelTagline,
      subscribers: getSubscribers(profile.clientId).size,
      upcomingCount: upcomingShows.filter((show) => show.hostId === profile.clientId).length
    }))
    .sort((a, b) => b.subscribers - a.subscribers || a.channelName.localeCompare(b.channelName));

  const hostUpcoming = upcomingShows.filter((show) => show.hostId === viewer.clientId).map(toShowResponse);
  const subscriberUpcoming = upcomingShows
    .filter((show) => subscriptions.includes(show.hostId))
    .map(toShowResponse);

  const relevantAlerts = alerts
    .filter((alert) => alert.hostId === viewer.clientId || subscriptions.includes(alert.hostId))
    .slice(-12)
    .reverse()
    .map((alert) => {
      const host = viewerProfiles.get(alert.hostId);
      const show = alert.showId ? shows.get(alert.showId) : null;
      return {
        id: alert.id,
        channelName: host?.channelName || host?.displayName || "Host",
        message: alert.message,
        createdAt: alert.createdAt,
        showTitle: show?.title || "",
        deliverySummary: alert.deliverySummary
      };
    });

  return {
    viewer: {
      ...viewer,
      subscriberCount: getSubscribers(viewer.clientId).size
    },
    channels,
    subscriptions,
    alerts: relevantAlerts,
    hostUpcoming,
    subscriberUpcoming
  };
}

function buildDeliverySummary(subscribers) {
  let inAppCount = 0;
  let emailCount = 0;
  let whatsappCount = 0;

  for (const subscriberId of subscribers) {
    const viewer = viewerProfiles.get(subscriberId);
    if (!viewer) continue;
    if (viewer.notificationPrefs?.alerts) inAppCount += 1;
    if (viewer.notificationPrefs?.email && viewer.email) emailCount += 1;
    if (viewer.notificationPrefs?.whatsapp && viewer.whatsapp) whatsappCount += 1;
  }

  return `In-app ${inAppCount} • Email ${emailCount} • WhatsApp ${whatsappCount}`;
}

function seedData() {
  const seedHosts = [
    {
      clientId: "host-cinema",
      displayName: "Nina Vale",
      channelName: "Cinema Circle",
      channelTagline: "Smart movie nights, scene breakdowns, and community replays."
    },
    {
      clientId: "host-kpop",
      displayName: "Arjun Flux",
      channelName: "Live Beat Lounge",
      channelTagline: "Come for music drops, stay for the fan theories and rewind moments."
    }
  ];

  for (const host of seedHosts) {
    const viewer = ensureViewer(host.clientId, host.displayName);
    viewer.channelName = host.channelName;
    viewer.channelTagline = host.channelTagline;
  }

  const seedShows = [
    {
      id: "show-cinema-premiere",
      hostId: "host-cinema",
      title: "Neo Noir Friday",
      description: "A moody late-night watch party with live reactions and scene notes.",
      roomId: "neo-noir-friday",
      videoId: "dQw4w9WgXcQ",
      scheduledFor: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      durationMinutes: 110
    },
    {
      id: "show-livebeat-premiere",
      hostId: "host-kpop",
      title: "Midnight MV Marathon",
      description: "Vote on the next music video while the room chat stays open all night.",
      roomId: "midnight-mv-marathon",
      videoId: "M7lc1UVf-VE",
      scheduledFor: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
      durationMinutes: 95
    }
  ];

  for (const show of seedShows) {
    if (!shows.has(show.id)) shows.set(show.id, show);
  }
}

seedData();

app.get("/api/app-state", (req, res) => {
  const viewer = ensureViewer(req.query.clientId, req.query.username);
  if (!viewer) return res.status(400).json({ error: "clientId is required" });
  res.json(buildAppState(viewer));
});

app.post("/api/profile", (req, res) => {
  const viewer = ensureViewer(req.body.clientId, req.body.username);
  if (!viewer) return res.status(400).json({ error: "clientId is required" });

  viewer.displayName = sanitizeUsername(req.body.displayName, viewer.displayName);
  viewer.email = sanitizeText(req.body.email, "", 80);
  viewer.whatsapp = sanitizeText(req.body.whatsapp, "", 40);
  viewer.notificationPrefs = {
    alerts: Boolean(req.body.notificationPrefs?.alerts),
    email: Boolean(req.body.notificationPrefs?.email),
    whatsapp: Boolean(req.body.notificationPrefs?.whatsapp)
  };

  res.json(buildAppState(viewer));
});

app.post("/api/channel", (req, res) => {
  const viewer = ensureViewer(req.body.clientId, req.body.username);
  if (!viewer) return res.status(400).json({ error: "clientId is required" });

  const channelName = sanitizeText(req.body.channelName, "", 48);
  if (!channelName) return res.status(400).json({ error: "Channel title is required" });

  viewer.channelName = channelName;
  viewer.channelTagline = sanitizeText(req.body.channelTagline, "", 90);
  res.json(buildAppState(viewer));
});

app.post("/api/shows", (req, res) => {
  const viewer = ensureViewer(req.body.clientId);
  if (!viewer) return res.status(400).json({ error: "clientId is required" });
  if (!viewer.channelName) return res.status(400).json({ error: "Create a channel first" });

  const title = sanitizeText(req.body.title, "", 70);
  const scheduledFor = sanitizeDate(req.body.scheduledFor);
  const roomId = sanitizeRoomId(req.body.roomId || title);
  const description = sanitizeText(req.body.description, "", 220);
  const videoId = sanitizeText(req.body.videoId, "", 20);
  const durationMinutes = Math.max(15, Math.min(480, Number(req.body.durationMinutes) || 90));

  if (!title) return res.status(400).json({ error: "Show title is required" });
  if (!scheduledFor) return res.status(400).json({ error: "Valid start time is required" });
  if (!roomId) return res.status(400).json({ error: "Valid room slug is required" });

  const show = {
    id: crypto.randomUUID(),
    hostId: viewer.clientId,
    title,
    description,
    roomId,
    videoId,
    scheduledFor,
    durationMinutes,
    createdAt: new Date().toISOString()
  };

  shows.set(show.id, show);
  res.json({ show: toShowResponse(show), state: buildAppState(viewer) });
});

app.post("/api/subscribe", (req, res) => {
  const viewer = ensureViewer(req.body.clientId);
  const hostId = sanitizeText(req.body.hostId, "", 80);
  if (!viewer || !hostId) return res.status(400).json({ error: "clientId and hostId are required" });
  if (hostId === viewer.clientId) return res.status(400).json({ error: "You cannot subscribe to yourself" });
  const host = viewerProfiles.get(hostId);
  if (!host?.channelName) return res.status(404).json({ error: "Host channel not found" });

  getSubscribers(hostId).add(viewer.clientId);
  res.json(buildAppState(viewer));
});

app.post("/api/unsubscribe", (req, res) => {
  const viewer = ensureViewer(req.body.clientId);
  const hostId = sanitizeText(req.body.hostId, "", 80);
  if (!viewer || !hostId) return res.status(400).json({ error: "clientId and hostId are required" });

  getSubscribers(hostId).delete(viewer.clientId);
  res.json(buildAppState(viewer));
});

app.post("/api/shows/:showId/alert", (req, res) => {
  const viewer = ensureViewer(req.body.clientId);
  const show = shows.get(req.params.showId);
  if (!viewer || !show) return res.status(404).json({ error: "Show not found" });
  if (show.hostId !== viewer.clientId) return res.status(403).json({ error: "Only the host can send alerts" });

  const subscribers = [...getSubscribers(show.hostId)];
  const alert = {
    id: crypto.randomUUID(),
    hostId: show.hostId,
    showId: show.id,
    message: `${show.title} starts ${new Date(show.scheduledFor).toLocaleString()}. Your room link is ready.`,
    createdAt: new Date().toISOString(),
    deliverySummary: buildDeliverySummary(subscribers)
  };
  alerts.push(alert);
  if (alerts.length > 50) alerts.splice(0, alerts.length - 50);

  res.json({ alert, state: buildAppState(viewer) });
});

wss.on("connection", (socket) => {
  let roomId = null;
  let clientId = null;

  socket.on("message", (raw) => {
    const msg = parseMessage(raw);
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "join") {
      if (typeof msg.roomId !== "string" || typeof msg.clientId !== "string") return;
      roomId = sanitizeRoomId(msg.roomId);
      clientId = sanitizeText(msg.clientId, "", 80);
      const username = sanitizeUsername(msg.username, `Wanderer-${clientId.slice(0, 4)}`);
      if (!roomId || !clientId) return;

      ensureViewer(clientId, username);
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
    if (room.clients.size === 0) rooms.delete(roomId);
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
