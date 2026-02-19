const state = {
  ws: null,
  roomId: "",
  clientId: crypto.randomUUID(),
  username: getOrCreateUsername(),
  hostId: null,
  player: null,
  joined: false,
  suppressPlayerEvents: false,
  playerReady: false,
  latencyMs: 0,
  driftTimer: null,
  userCount: 0
};

function getBackendWsUrl() {
  const forced = window.localStorage.getItem("syncb.wsUrl");
  if (forced) return forced;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

const BACKEND_WS_URL = getBackendWsUrl();

const statusEl = document.getElementById("status");
const roomIdEl = document.getElementById("roomId");
const joinBtn = document.getElementById("joinBtn");
const inviteBtn = document.getElementById("inviteBtn");
const beHostBtn = document.getElementById("beHostBtn");
const videoInput = document.getElementById("videoInput");
const loadVideoBtn = document.getElementById("loadVideoBtn");
const roomMetaEl = document.getElementById("roomMeta");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function getOrCreateUsername() {
  const saved = window.localStorage.getItem("syncb.username");
  if (saved) return saved;
  const title = [
    "Astral",
    "Moonlit",
    "Ember",
    "Misty",
    "Crystal",
    "Arcane",
    "Whispering",
    "Starlit",
    "Golden",
    "Velvet"
  ];
  const kind = [
    "Phoenix",
    "Dragon",
    "Warden",
    "Bard",
    "Sprite",
    "Raven",
    "Griffin",
    "Sorcerer",
    "Nomad",
    "Seer"
  ];
  const num = String(Math.floor(Math.random() * 900) + 100);
  const name = `${title[Math.floor(Math.random() * title.length)]}${kind[Math.floor(Math.random() * kind.length)]}${num}`;
  window.localStorage.setItem("syncb.username", name);
  return name;
}

function getRoomInviteUrl(roomId) {
  const room = roomId.trim();
  if (!room) return "";
  const url = new URL(window.location.href);
  url.searchParams.set("room", room);
  return url.toString();
}

function updateRoomMeta() {
  roomMetaEl.textContent = `Users in room: ${state.userCount}`;
}

function appendChatMessage({ clientId, username, text }) {
  const messageEl = document.createElement("p");
  const sender = clientId === state.clientId ? `${state.username} (You)` : username || `Wanderer-${clientId.slice(0, 6)}`;
  messageEl.textContent = `${sender}: ${text}`;
  chatMessagesEl.appendChild(messageEl);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function updateLoadButtonState() {
  loadVideoBtn.disabled = !(isHost() && state.playerReady);
}

function isHost() {
  return state.clientId === state.hostId;
}

function wsSend(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify(payload));
}

function parseVideoId(input) {
  const value = input.trim();
  if (!value) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const u = new URL(value);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").slice(0, 11);
    if (u.searchParams.has("v")) return (u.searchParams.get("v") || "").slice(0, 11);
    const parts = u.pathname.split("/");
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1].slice(0, 11);
  } catch {}
  return "";
}

function projectedRemoteTime(remoteState) {
  const elapsed = (Date.now() - remoteState.updatedAt + state.latencyMs / 2) / 1000;
  if (!remoteState.playing) return remoteState.currentTime;
  return remoteState.currentTime + elapsed * remoteState.playbackRate;
}

function applyRemoteState(remoteState) {
  if (!state.player || !remoteState.videoId) return;

  const currentVideo = state.player.getVideoData().video_id || "";
  if (currentVideo !== remoteState.videoId) {
    state.suppressPlayerEvents = true;
    state.player.loadVideoById({
      videoId: remoteState.videoId,
      startSeconds: Math.max(0, projectedRemoteTime(remoteState))
    });
    state.player.setPlaybackRate(remoteState.playbackRate || 1);
    state.suppressPlayerEvents = false;
    return;
  }

  const targetTime = Math.max(0, projectedRemoteTime(remoteState));
  const localTime = state.player.getCurrentTime();
  const drift = Math.abs(targetTime - localTime);

  if (Math.abs((state.player.getPlaybackRate?.() || 1) - remoteState.playbackRate) > 0.01) {
    state.suppressPlayerEvents = true;
    state.player.setPlaybackRate(remoteState.playbackRate);
    state.suppressPlayerEvents = false;
  }

  if (drift > 0.35) {
    state.suppressPlayerEvents = true;
    state.player.seekTo(targetTime, true);
    state.suppressPlayerEvents = false;
  }

  const shouldPlay = remoteState.playing;
  const ytState = state.player.getPlayerState();
  const isPlayingNow = ytState === YT.PlayerState.PLAYING;
  if (shouldPlay !== isPlayingNow) {
    state.suppressPlayerEvents = true;
    if (shouldPlay) state.player.playVideo();
    else state.player.pauseVideo();
    state.suppressPlayerEvents = false;
  }
}

function sendHostSync(patch) {
  if (!isHost()) return;
  wsSend({ type: "sync", patch });
}

function startLatencyPings() {
  setInterval(() => {
    if (!state.joined) return;
    wsSend({ type: "ping", ts: Date.now() });
  }, 2000);
}

function startDriftCorrection() {
  if (state.driftTimer) clearInterval(state.driftTimer);
  state.driftTimer = setInterval(() => {
    if (!state.joined || isHost() || !state.player) return;
    wsSend({ type: "sync_request" });
  }, 1500);
}

function connect(roomId) {
  state.ws = new WebSocket(BACKEND_WS_URL);
  state.roomId = roomId;

  state.ws.addEventListener("open", () => {
    state.joined = true;
    wsSend({ type: "join", roomId, clientId: state.clientId, username: state.username });
    window.history.replaceState(null, "", getRoomInviteUrl(roomId));
    setStatus(`Connected to room "${roomId}"`);
    beHostBtn.disabled = false;
    updateLoadButtonState();
  });

  state.ws.addEventListener("close", () => {
    state.joined = false;
    state.userCount = 0;
    setStatus("Disconnected");
    updateRoomMeta();
    beHostBtn.disabled = true;
    loadVideoBtn.disabled = true;
  });

  state.ws.addEventListener("error", () => {
    setStatus(`WebSocket failed: ${BACKEND_WS_URL}`);
  });

  state.ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "room_state") {
      state.hostId = msg.hostId;
      if (typeof msg.userCount === "number") state.userCount = msg.userCount;
      setStatus(`Connected. Host: ${state.hostId === state.clientId ? "You" : "Another user"}`);
      updateRoomMeta();
      updateLoadButtonState();
      applyRemoteState(msg.state);
      return;
    }

    if (msg.type === "user_count" && typeof msg.count === "number") {
      state.userCount = msg.count;
      updateRoomMeta();
      return;
    }

    if (msg.type === "host_changed") {
      state.hostId = msg.hostId;
      setStatus(`Host changed: ${msg.hostId === state.clientId ? "You are host" : "Another user"}`);
      updateLoadButtonState();
      return;
    }

    if (msg.type === "sync" && !isHost()) {
      applyRemoteState(msg.state);
      return;
    }

    if (msg.type === "pong" && typeof msg.ts === "number") {
      state.latencyMs = Date.now() - msg.ts;
      return;
    }

    if (msg.type === "chat" && typeof msg.clientId === "string" && typeof msg.text === "string") {
      appendChatMessage(msg);
    }
  });
}

function onYouTubeIframeAPIReady() {
  state.player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    videoId: "",
    playerVars: {
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        state.playerReady = true;
        setStatus("Player ready. Join a room.");
        updateLoadButtonState();
      },
      onStateChange: (event) => {
        if (!isHost() || state.suppressPlayerEvents) return;
        if (event.data === YT.PlayerState.PLAYING) {
          sendHostSync({
            playing: true,
            currentTime: state.player.getCurrentTime(),
            playbackRate: state.player.getPlaybackRate()
          });
        } else if (event.data === YT.PlayerState.PAUSED) {
          sendHostSync({
            playing: false,
            currentTime: state.player.getCurrentTime(),
            playbackRate: state.player.getPlaybackRate()
          });
        }
      },
      onPlaybackRateChange: () => {
        if (!isHost() || state.suppressPlayerEvents) return;
        sendHostSync({
          playbackRate: state.player.getPlaybackRate(),
          currentTime: state.player.getCurrentTime()
        });
      }
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

joinBtn.addEventListener("click", () => {
  const roomId = roomIdEl.value.trim();
  if (!roomId) {
    setStatus("Enter a room id.");
    return;
  }
  if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.close();
  connect(roomId);
});

beHostBtn.addEventListener("click", () => {
  wsSend({ type: "set_host" });
});

loadVideoBtn.addEventListener("click", () => {
  if (!isHost()) return;
  if (!state.playerReady || !state.player) {
    setStatus("Player is still loading. Try again in a moment.");
    return;
  }
  const videoId = parseVideoId(videoInput.value);
  if (!videoId) {
    setStatus("Enter a valid YouTube link or video ID.");
    return;
  }
  state.suppressPlayerEvents = true;
  state.player.loadVideoById({ videoId, startSeconds: 0 });
  state.suppressPlayerEvents = false;
  sendHostSync({
    videoId,
    playing: true,
    currentTime: 0,
    playbackRate: 1
  });
});

function sendChat() {
  const text = chatInputEl.value.trim();
  if (!text || !state.joined) return;
  wsSend({ type: "chat", text });
  chatInputEl.value = "";
}

sendChatBtn.addEventListener("click", sendChat);
chatInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChat();
});

inviteBtn.addEventListener("click", async () => {
  const room = state.roomId || roomIdEl.value.trim();
  if (!room) {
    setStatus("Enter or join a room first.");
    return;
  }
  const inviteUrl = getRoomInviteUrl(room);
  if (!inviteUrl) return;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Join my SyncTube room",
        text: `Join room: ${room}`,
        url: inviteUrl
      });
      setStatus("Invite shared.");
      return;
    }
  } catch {}

  try {
    await navigator.clipboard.writeText(inviteUrl);
    setStatus("Invite link copied.");
  } catch {
    setStatus(`Invite link: ${inviteUrl}`);
  }
});

document.addEventListener("keydown", (e) => {
  if (!isHost() || !state.player) return;
  if (e.key === "ArrowLeft") {
    const next = Math.max(0, state.player.getCurrentTime() - 5);
    state.player.seekTo(next, true);
    sendHostSync({ currentTime: next });
  } else if (e.key === "ArrowRight") {
    const next = state.player.getCurrentTime() + 5;
    state.player.seekTo(next, true);
    sendHostSync({ currentTime: next });
  }
});

startLatencyPings();
startDriftCorrection();
updateRoomMeta();

const initialRoom = new URLSearchParams(window.location.search).get("room");
if (initialRoom) {
  roomIdEl.value = initialRoom;
  joinBtn.click();
}
