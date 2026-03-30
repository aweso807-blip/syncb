const state = {
  ws: null,
  roomId: "",
  clientId: getOrCreateClientId(),
  username: getOrCreateUsername(),
  hostId: null,
  player: null,
  joined: false,
  suppressPlayerEvents: false,
  playerReady: false,
  latencyMs: 0,
  driftTimer: null,
  userCount: 0,
  appData: {
    viewer: null,
    channels: [],
    subscriptions: [],
    alerts: [],
    hostUpcoming: [],
    subscriberUpcoming: []
  }
};

function getOrCreateClientId() {
  const saved = window.localStorage.getItem("syncb.clientId");
  if (saved) return saved;
  const id = crypto.randomUUID();
  window.localStorage.setItem("syncb.clientId", id);
  return id;
}

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
const roomHintEl = document.getElementById("roomHint");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

const identityCardEl = document.getElementById("identityCard");
const profileFormEl = document.getElementById("profileForm");
const channelFormEl = document.getElementById("channelForm");
const showFormEl = document.getElementById("showForm");

const displayNameInputEl = document.getElementById("displayNameInput");
const emailInputEl = document.getElementById("emailInput");
const whatsappInputEl = document.getElementById("whatsappInput");
const prefAlertsInputEl = document.getElementById("prefAlertsInput");
const prefEmailInputEl = document.getElementById("prefEmailInput");
const prefWhatsappInputEl = document.getElementById("prefWhatsappInput");

const channelNameInputEl = document.getElementById("channelNameInput");
const channelTaglineInputEl = document.getElementById("channelTaglineInput");
const myChannelCardEl = document.getElementById("myChannelCard");

const showTitleInputEl = document.getElementById("showTitleInput");
const showDateInputEl = document.getElementById("showDateInput");
const showDurationInputEl = document.getElementById("showDurationInput");
const showRoomInputEl = document.getElementById("showRoomInput");
const showVideoInputEl = document.getElementById("showVideoInput");
const showDescriptionInputEl = document.getElementById("showDescriptionInput");

const channelDirectoryEl = document.getElementById("channelDirectory");
const alertsFeedEl = document.getElementById("alertsFeed");
const subscriberUpcomingEl = document.getElementById("subscriberUpcoming");
const hostUpcomingEl = document.getElementById("hostUpcoming");
const quickJoinListEl = document.getElementById("quickJoinList");

function setStatus(text) {
  statusEl.textContent = text;
}

function getOrCreateUsername() {
  const saved = window.localStorage.getItem("syncb.username");
  if (saved) return saved;
  const title = ["Astral", "Moonlit", "Ember", "Misty", "Crystal", "Golden", "Velvet"];
  const kind = ["Phoenix", "Dragon", "Bard", "Sprite", "Raven", "Nomad", "Seer"];
  const num = String(Math.floor(Math.random() * 900) + 100);
  const name = `${title[Math.floor(Math.random() * title.length)]}${kind[Math.floor(Math.random() * kind.length)]}${num}`;
  window.localStorage.setItem("syncb.username", name);
  return name;
}

function isHost() {
  return state.clientId === state.hostId;
}

function updateLoadButtonState() {
  loadVideoBtn.disabled = !(isHost() && state.playerReady);
}

function wsSend(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify(payload));
}

function getRoomInviteUrl(roomId) {
  const room = roomId.trim();
  if (!room) return "";
  const url = new URL(window.location.href);
  url.searchParams.set("room", room);
  return url.toString();
}

function getShowWatchUrl(show) {
  return getRoomInviteUrl(show.roomId || show.id);
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

function parseVideoId(input) {
  const value = input.trim();
  if (!value) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "").slice(0, 11);
    if (url.searchParams.has("v")) return (url.searchParams.get("v") || "").slice(0, 11);
    const parts = url.pathname.split("/");
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1].slice(0, 11);
  } catch {}
  return "";
}

function formatDate(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "TBD";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function relativeTime(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 36) return rtf.format(diffHours, "hour");
  return rtf.format(Math.round(diffHours / 24), "day");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function projectedRemoteTime(remoteState) {
  const elapsed = (Date.now() - remoteState.updatedAt + state.latencyMs / 2) / 1000;
  if (!remoteState.playing) return remoteState.currentTime;
  return remoteState.currentTime + elapsed * remoteState.playbackRate;
}

function applyRemoteState(remoteState) {
  if (!state.player || !remoteState?.videoId) return;

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

  const ytState = state.player.getPlayerState();
  const isPlayingNow = ytState === YT.PlayerState.PLAYING;
  if (Boolean(remoteState.playing) !== isPlayingNow) {
    state.suppressPlayerEvents = true;
    if (remoteState.playing) state.player.playVideo();
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
    roomHintEl.textContent = "Room connected. Subscribers can now chat and watch together in sync.";
  });

  state.ws.addEventListener("close", () => {
    state.joined = false;
    state.userCount = 0;
    setStatus("Disconnected");
    updateRoomMeta();
    beHostBtn.disabled = true;
    loadVideoBtn.disabled = true;
    roomHintEl.textContent = "Tip: scheduled shows already generate a room link, so subscribers can join in one tap.";
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
    playerVars: { rel: 0, modestbranding: 1 },
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

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return response.json();
}

async function loadAppData() {
  const params = new URLSearchParams({
    clientId: state.clientId,
    username: state.username
  });
  const payload = await api(`/api/app-state?${params.toString()}`);
  state.appData = payload;
  if (payload.viewer?.displayName) {
    state.username = payload.viewer.displayName;
    window.localStorage.setItem("syncb.username", state.username);
  }
  fillForms();
  renderDashboard();
}

function fillForms() {
  const viewer = state.appData.viewer;
  if (!viewer) return;
  displayNameInputEl.value = viewer.displayName || "";
  emailInputEl.value = viewer.email || "";
  whatsappInputEl.value = viewer.whatsapp || "";
  prefAlertsInputEl.checked = Boolean(viewer.notificationPrefs?.alerts);
  prefEmailInputEl.checked = Boolean(viewer.notificationPrefs?.email);
  prefWhatsappInputEl.checked = Boolean(viewer.notificationPrefs?.whatsapp);
  channelNameInputEl.value = viewer.channelName || "";
  channelTaglineInputEl.value = viewer.channelTagline || "";
}

function renderEmpty(message) {
  return `<div class="emptyState">${escapeHtml(message)}</div>`;
}

function renderIdentityCard() {
  const viewer = state.appData.viewer;
  if (!viewer) return;
  const subscriptionCount = state.appData.subscriptions.length;
  const hostCount = state.appData.channels.filter((channel) => channel.subscribers > 0 && channel.id === viewer.clientId).length;
  identityCardEl.className = "heroCard";
  identityCardEl.innerHTML = `
    <p class="identityTitle">Signed in as</p>
    <p class="identityName">${escapeHtml(viewer.displayName || state.username)}</p>
    <p class="identityMeta">${subscriptionCount} subscriptions • ${hostCount || viewer.subscriberCount || 0} subscribers</p>
    <p class="subtleText">Client ID: ${escapeHtml(viewer.clientId.slice(0, 8))}</p>
  `;
}

function renderMyChannelCard() {
  const viewer = state.appData.viewer;
  if (!viewer?.channelName) {
    myChannelCardEl.innerHTML = renderEmpty("Turn on your host channel to start publishing scheduled shows.");
    return;
  }
  myChannelCardEl.innerHTML = `
    <div class="channelCard">
      <div class="cardTop">
        <div>
          <p class="cardTitle">${escapeHtml(viewer.channelName)}</p>
          <p class="cardCopy">${escapeHtml(viewer.channelTagline || "Your personal watch channel is live.")}</p>
        </div>
        <span class="pill live">Host ready</span>
      </div>
      <p class="listMeta">${viewer.subscriberCount} subscribers • ${state.appData.hostUpcoming.length} upcoming shows</p>
    </div>
  `;
}

function renderChannels() {
  const channels = state.appData.channels;
  if (!channels.length) {
    channelDirectoryEl.innerHTML = renderEmpty("No host channels yet. Be the first creator in this roomverse.");
    return;
  }

  channelDirectoryEl.innerHTML = channels
    .map((channel) => {
      const subscribed = state.appData.subscriptions.includes(channel.id);
      const isMine = channel.id === state.clientId;
      return `
        <div class="channelCard">
          <div class="cardTop">
            <div class="avatarBadge">${escapeHtml((channel.channelName || channel.displayName || "?").slice(0, 1).toUpperCase())}</div>
            <span class="pill">${channel.subscribers} subscribers</span>
          </div>
          <div>
            <p class="cardTitle">${escapeHtml(channel.channelName || channel.displayName)}</p>
            <p class="cardCopy">${escapeHtml(channel.channelTagline || "Join this host for scheduled community watch sessions.")}</p>
          </div>
          <p class="listMeta">${channel.upcomingCount} upcoming shows</p>
          <div class="cardActions">
            ${
              isMine
                ? `<button class="ghostButton" data-action="channel-focus">Your channel</button>`
                : `<button data-action="${subscribed ? "unsubscribe" : "subscribe"}" data-host-id="${escapeHtml(channel.id)}">${subscribed ? "Subscribed" : "Subscribe"}</button>`
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAlerts() {
  const alerts = state.appData.alerts;
  if (!alerts.length) {
    alertsFeedEl.innerHTML = renderEmpty("Host alerts will land here when channels you follow announce a show.");
    return;
  }
  alertsFeedEl.innerHTML = alerts
    .map(
      (alert) => `
        <div class="listCard">
          <div class="cardTop">
            <div>
              <p class="listTitle">${escapeHtml(alert.channelName)}</p>
              <p class="listMeta">${escapeHtml(alert.message)}</p>
            </div>
            <span class="pill">${escapeHtml(relativeTime(alert.createdAt))}</span>
          </div>
          ${alert.showTitle ? `<p class="noticeText">Show: ${escapeHtml(alert.showTitle)}</p>` : ""}
          <p class="noticeText">Delivery: ${escapeHtml(alert.deliverySummary)}</p>
        </div>
      `
    )
    .join("");
}

function buildShowCard(show, options = {}) {
  const {
    canAlert = false,
    actionLabel = "Join room",
    action = "join-show",
    secondaryAction = ""
  } = options;
  const startText = formatDate(show.scheduledFor);
  const relativeText = relativeTime(show.scheduledFor);
  return `
    <div class="listCard">
      <div class="cardTop">
        <div>
          <p class="listTitle">${escapeHtml(show.title)}</p>
          <p class="listMeta">${escapeHtml(show.channelName)} • ${escapeHtml(startText)} • ${escapeHtml(relativeText)}</p>
        </div>
        <span class="pill">${show.durationMinutes} min</span>
      </div>
      <p class="cardCopy">${escapeHtml(show.description || "Scheduled community watch session.")}</p>
      <p class="noticeText">Room: ${escapeHtml(show.roomId)}${show.videoId ? ` • Video ready` : ""}</p>
      <div class="listActions">
        <button data-action="${action}" data-show-id="${escapeHtml(show.id)}">${actionLabel}</button>
        <button class="ghostButton" data-action="copy-link" data-show-id="${escapeHtml(show.id)}">Copy link</button>
        ${secondaryAction}
        ${
          canAlert
            ? `<button class="ghostButton" data-action="alert-show" data-show-id="${escapeHtml(show.id)}">Alert subscribers</button>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderUpcomingLists() {
  subscriberUpcomingEl.innerHTML = state.appData.subscriberUpcoming.length
    ? state.appData.subscriberUpcoming.map((show) => buildShowCard(show)).join("")
    : renderEmpty("Subscribe to a host channel to build your upcoming watch list.");

  hostUpcomingEl.innerHTML = state.appData.hostUpcoming.length
    ? state.appData.hostUpcoming
        .map((show) =>
          buildShowCard(show, {
            canAlert: true,
            secondaryAction: `<button class="ghostButton" data-action="prefill-show-room" data-show-id="${escapeHtml(show.id)}">Load into studio</button>`
          })
        )
        .join("")
    : renderEmpty("Create a scheduled show and it will appear here with a pre-made room link.");

  const quickJoinItems = [...state.appData.hostUpcoming, ...state.appData.subscriberUpcoming]
    .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
    .slice(0, 4);
  quickJoinListEl.innerHTML = quickJoinItems.length
    ? quickJoinItems.map((show) => buildShowCard(show, { actionLabel: "Open room" })).join("")
    : renderEmpty("Your next rooms will show up here for one-tap access.");
}

function renderDashboard() {
  renderIdentityCard();
  renderMyChannelCard();
  renderChannels();
  renderAlerts();
  renderUpcomingLists();
}

async function saveProfile(event) {
  event.preventDefault();
  const payload = {
    clientId: state.clientId,
    username: state.username,
    displayName: displayNameInputEl.value.trim(),
    email: emailInputEl.value.trim(),
    whatsapp: whatsappInputEl.value.trim(),
    notificationPrefs: {
      alerts: prefAlertsInputEl.checked,
      email: prefEmailInputEl.checked,
      whatsapp: prefWhatsappInputEl.checked
    }
  };
  const result = await api("/api/profile", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  state.username = result.viewer.displayName;
  window.localStorage.setItem("syncb.username", state.username);
  await loadAppData();
  setStatus("Profile saved.");
}

async function saveChannel(event) {
  event.preventDefault();
  await api("/api/channel", {
    method: "POST",
    body: JSON.stringify({
      clientId: state.clientId,
      username: state.username,
      channelName: channelNameInputEl.value.trim(),
      channelTagline: channelTaglineInputEl.value.trim()
    })
  });
  await loadAppData();
  setStatus("Host channel updated.");
}

async function createShow(event) {
  event.preventDefault();
  const roomId = showRoomInputEl.value.trim() || slugify(showTitleInputEl.value.trim());
  const payload = {
    clientId: state.clientId,
    title: showTitleInputEl.value.trim(),
    scheduledFor: showDateInputEl.value,
    durationMinutes: Number(showDurationInputEl.value) || 90,
    roomId,
    videoId: parseVideoId(showVideoInputEl.value),
    description: showDescriptionInputEl.value.trim()
  };
  await api("/api/shows", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  showFormEl.reset();
  showDurationInputEl.value = "90";
  await loadAppData();
  setStatus("Scheduled show created.");
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function subscribe(hostId) {
  await api("/api/subscribe", {
    method: "POST",
    body: JSON.stringify({ clientId: state.clientId, hostId })
  });
  await loadAppData();
}

async function unsubscribe(hostId) {
  await api("/api/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ clientId: state.clientId, hostId })
  });
  await loadAppData();
}

async function sendShowAlert(showId) {
  await api(`/api/shows/${encodeURIComponent(showId)}/alert`, {
    method: "POST",
    body: JSON.stringify({ clientId: state.clientId })
  });
  await loadAppData();
  setStatus("Subscribers alerted.");
}

function findShowById(showId) {
  return [...state.appData.hostUpcoming, ...state.appData.subscriberUpcoming].find((show) => show.id === showId) || null;
}

async function copyShowLink(showId) {
  const show = findShowById(showId);
  if (!show) return;
  const url = getShowWatchUrl(show);
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Show link copied.");
  } catch {
    setStatus(url);
  }
}

function prepareRoom(show) {
  roomIdEl.value = show.roomId;
  videoInputEl.value = show.videoId || "";
  roomHintEl.textContent = `${show.title} is ready in room "${show.roomId}".`;
}

function joinScheduledShow(showId) {
  const show = findShowById(showId);
  if (!show) return;
  prepareRoom(show);
  if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.close();
  connect(show.roomId);
}

function prefillShowRoom(showId) {
  const show = state.appData.hostUpcoming.find((item) => item.id === showId);
  if (!show) return;
  prepareRoom(show);
  showTitleInputEl.value = show.title;
  showRoomInputEl.value = show.roomId;
  showVideoInputEl.value = show.videoId || "";
  showDescriptionInputEl.value = show.description || "";
  setStatus(`Loaded "${show.title}" into the studio controls.`);
}

channelDirectoryEl.addEventListener("click", async (event) => {
  const target = event.target.closest("button[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const hostId = target.dataset.hostId;
  if (action === "subscribe" && hostId) await subscribe(hostId);
  if (action === "unsubscribe" && hostId) await unsubscribe(hostId);
});

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const showId = target.dataset.showId;
  if (action === "join-show" && showId) joinScheduledShow(showId);
  if (action === "copy-link" && showId) await copyShowLink(showId);
  if (action === "alert-show" && showId) await sendShowAlert(showId);
  if (action === "prefill-show-room" && showId) prefillShowRoom(showId);
});

profileFormEl.addEventListener("submit", (event) => {
  saveProfile(event).catch((error) => setStatus(error.message));
});

channelFormEl.addEventListener("submit", (event) => {
  saveChannel(event).catch((error) => setStatus(error.message));
});

showFormEl.addEventListener("submit", (event) => {
  createShow(event).catch((error) => setStatus(error.message));
});

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
chatInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendChat();
});

inviteBtn.addEventListener("click", async () => {
  const room = state.roomId || roomIdEl.value.trim();
  if (!room) {
    setStatus("Enter or join a room first.");
    return;
  }
  const inviteUrl = getRoomInviteUrl(room);
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

document.addEventListener("keydown", (event) => {
  if (!isHost() || !state.player) return;
  if (event.key === "ArrowLeft") {
    const next = Math.max(0, state.player.getCurrentTime() - 5);
    state.player.seekTo(next, true);
    sendHostSync({ currentTime: next });
  } else if (event.key === "ArrowRight") {
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
}

loadAppData()
  .then(() => {
    if (initialRoom) joinBtn.click();
  })
  .catch((error) => setStatus(error.message));
