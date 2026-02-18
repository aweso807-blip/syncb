const state = {
  ws: null,
  roomId: "",
  clientId: crypto.randomUUID(),
  hostId: null,
  player: null,
  joined: false,
  suppressPlayerEvents: false,
  latencyMs: 0,
  driftTimer: null
};

const statusEl = document.getElementById("status");
const roomIdEl = document.getElementById("roomId");
const wsUrlEl = document.getElementById("wsUrl");
const joinBtn = document.getElementById("joinBtn");
const beHostBtn = document.getElementById("beHostBtn");
const videoInput = document.getElementById("videoInput");
const loadVideoBtn = document.getElementById("loadVideoBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function isHost() {
  return state.clientId === state.hostId;
}

function wsSend(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify(payload));
}

function getWsUrl() {
  const typed = wsUrlEl.value.trim();
  if (typed) {
    if (typed.startsWith("https://")) return `wss://${typed.slice("https://".length)}`;
    if (typed.startsWith("http://")) return `ws://${typed.slice("http://".length)}`;
    return typed;
  }
  const query = new URLSearchParams(location.search).get("ws");
  if (query) {
    if (query.startsWith("https://")) return `wss://${query.slice("https://".length)}`;
    if (query.startsWith("http://")) return `ws://${query.slice("http://".length)}`;
    return query;
  }
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
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
  const wsUrl = getWsUrl();
  localStorage.setItem("sync_ws_url", wsUrlEl.value.trim());
  state.ws = new WebSocket(wsUrl);
  state.roomId = roomId;

  state.ws.addEventListener("open", () => {
    state.joined = true;
    wsSend({ type: "join", roomId, clientId: state.clientId });
    setStatus(`Connected to room "${roomId}" via ${wsUrl}`);
    beHostBtn.disabled = false;
    loadVideoBtn.disabled = !isHost();
  });

  state.ws.addEventListener("close", () => {
    state.joined = false;
    setStatus("Disconnected");
    beHostBtn.disabled = true;
    loadVideoBtn.disabled = true;
  });

  state.ws.addEventListener("error", () => {
    setStatus(`WebSocket failed. Check URL: ${wsUrl}`);
  });

  state.ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "room_state") {
      state.hostId = msg.hostId;
      setStatus(`Connected. Host: ${state.hostId === state.clientId ? "You" : "Another user"}`);
      loadVideoBtn.disabled = !isHost();
      applyRemoteState(msg.state);
      return;
    }

    if (msg.type === "host_changed") {
      state.hostId = msg.hostId;
      setStatus(`Host changed: ${msg.hostId === state.clientId ? "You are host" : "Another user"}`);
      loadVideoBtn.disabled = !isHost();
      return;
    }

    if (msg.type === "sync" && !isHost()) {
      applyRemoteState(msg.state);
      return;
    }

    if (msg.type === "pong" && typeof msg.ts === "number") {
      state.latencyMs = Date.now() - msg.ts;
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
      onReady: () => setStatus("Player ready. Join a room."),
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

wsUrlEl.value = localStorage.getItem("sync_ws_url") || "";

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
