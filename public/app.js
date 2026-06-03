// SyncTube Studio frontend
// Real-time YouTube watch-along. WebSocket transport, host-driven sync.
// Drift correction is server-pushed; see broadcastTick in server.js.

// ---------------------------------------------------------------------------
// State + persistent identity
// ---------------------------------------------------------------------------

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
  userCount: 0,
  activeTab: "home",
  theme: getInitialTheme(),
  feedGenre: "all",
  reconnect: { attempts: 0, timer: null, intentional: false },
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
  const saved = localStorage.getItem("syncb.clientId");
  if (saved) return saved;
  const id = crypto.randomUUID();
  localStorage.setItem("syncb.clientId", id);
  return id;
}

function getOrCreateUsername() {
  const saved = localStorage.getItem("syncb.username");
  if (saved) return saved;
  const a = ["Astral", "Moonlit", "Ember", "Misty", "Crystal", "Golden", "Velvet"];
  const b = ["Phoenix", "Dragon", "Bard", "Sprite", "Raven", "Nomad", "Seer"];
  const name = `${a[Math.floor(Math.random() * a.length)]}${b[Math.floor(Math.random() * b.length)]}${Math.floor(Math.random() * 900) + 100}`;
  localStorage.setItem("syncb.username", name);
  return name;
}

function getInitialTheme() {
  const saved = localStorage.getItem("syncb.theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

function getBackendWsUrl() {
  const forced = localStorage.getItem("syncb.wsUrl");
  if (forced) return forced;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}`;
}

const BACKEND_WS_URL = getBackendWsUrl();
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 15000;
const LATENCY_PING_MS = 4000;
const LATENCY_EMA_ALPHA = 0.2;
const LATENCY_OUTLIER_FACTOR = 4;
const SYNC_DRIFT_THRESHOLD = 0.35;

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const roomIdEl = $("roomId");
const joinBtn = $("joinBtn");
const inviteBtn = $("inviteBtn");
const beHostBtn = $("beHostBtn");
const videoInput = $("videoInput");
const loadVideoBtn = $("loadVideoBtn");
const roomMetaEl = $("roomMeta");
const roomHintEl = $("roomHint");
const chatMessagesEl = $("chatMessages");
const chatInputEl = $("chatInput");
const sendChatBtn = $("sendChatBtn");
const themeToggleBtn = $("themeToggleBtn");
const identityCardEl = $("identityCard");
const profileFormEl = $("profileForm");
const channelFormEl = $("channelForm");
const showFormEl = $("showForm");
const displayNameInputEl = $("displayNameInput");
const emailInputEl = $("emailInput");
const whatsappInputEl = $("whatsappInput");
const prefAlertsInputEl = $("prefAlertsInput");
const prefEmailInputEl = $("prefEmailInput");
const prefWhatsappInputEl = $("prefWhatsappInput");
const channelNameInputEl = $("channelNameInput");
const channelTaglineInputEl = $("channelTaglineInput");
const channelGenresInputEl = $("channelGenresInput");
const myChannelCardEl = $("myChannelCard");
const showTitleInputEl = $("showTitleInput");
const showDateInputEl = $("showDateInput");
const showDurationInputEl = $("showDurationInput");
const showRoomInputEl = $("showRoomInput");
const showVideoInputEl = $("showVideoInput");
const showGenresInputEl = $("showGenresInput");
const showDescriptionInputEl = $("showDescriptionInput");
const heroStatsEl = $("heroStats");
const heroFeaturedShowEl = $("heroFeaturedShow");
const genreRailEl = $("genreRail");
const spotlightRailEl = $("spotlightRail");
const featuredFeedEl = $("featuredFeed");
const feedGenreFiltersEl = $("feedGenreFilters");
const channelDirectoryEl = $("channelDirectory");
const alertsFeedEl = $("alertsFeed");
const subscriberUpcomingEl = $("subscriberUpcoming");
const hostUpcomingEl = $("hostUpcoming");
const quickJoinListEl = $("quickJoinList");

const tabButtons = [...document.querySelectorAll(".tabButton")];
const views = [...document.querySelectorAll(".contentView")];
const heroSectionEl = document.querySelector('.hero[data-view="home"]');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setStatus = (text) => (statusEl.textContent = text);
const isHost = () => state.clientId === state.hostId;
const updateLoadButtonState = () => (loadVideoBtn.disabled = !(isHost() && state.playerReady));
const updateRoomMeta = () => (roomMetaEl.textContent = `Users in room: ${state.userCount}`);

const wsSend = (payload) => {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(payload));
  }
};

function getRoomInviteUrl(roomId) {
  const room = roomId.trim();
  if (!room) return "";
  const url = new URL(location.href);
  url.searchParams.set("room", room);
  return url.toString();
}

const getShowWatchUrl = (show) => getRoomInviteUrl(show.roomId || show.id);

function appendChatMessage({ clientId, username, text }) {
  const p = document.createElement("p");
  const sender = clientId === state.clientId
    ? `${state.username} (You)`
    : username || `Wanderer-${clientId.slice(0, 6)}`;
  p.textContent = `${sender}: ${text}`;
  chatMessagesEl.appendChild(p);
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
    const i = parts.indexOf("embed");
    if (i >= 0 && parts[i + 1]) return parts[i + 1].slice(0, 11);
  } catch {}
  return "";
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "TBD";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  }).format(d);
}

function relativeTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.round((d.getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(diff) < 60) return rtf.format(diff, "minute");
  const hrs = Math.round(diff / 60);
  if (Math.abs(hrs) < 36) return rtf.format(hrs, "hour");
  return rtf.format(Math.round(hrs / 24), "day");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---------------------------------------------------------------------------
// Sync engine
// ---------------------------------------------------------------------------

function projectedRemoteTime(remote) {
  // Half RTT approximates server -> client one-way latency.
  const elapsed = (Date.now() - remote.updatedAt + state.latencyMs / 2) / 1000;
  return remote.playing ? remote.currentTime + elapsed * remote.playbackRate : remote.currentTime;
}

function applyRemoteState(remote) {
  if (!state.player || !remote?.videoId) return;

  const current = state.player.getVideoData().video_id || "";
  if (current !== remote.videoId) {
    state.suppressPlayerEvents = true;
    state.player.loadVideoById({
      videoId: remote.videoId,
      startSeconds: Math.max(0, projectedRemoteTime(remote))
    });
    state.player.setPlaybackRate(remote.playbackRate || 1);
    state.suppressPlayerEvents = false;
    return;
  }

  const target = Math.max(0, projectedRemoteTime(remote));
  const local = state.player.getCurrentTime();
  const localRate = state.player.getPlaybackRate?.() || 1;

  if (Math.abs(localRate - remote.playbackRate) > 0.01) {
    state.suppressPlayerEvents = true;
    state.player.setPlaybackRate(remote.playbackRate);
    state.suppressPlayerEvents = false;
  }

  if (Math.abs(target - local) > SYNC_DRIFT_THRESHOLD) {
    state.suppressPlayerEvents = true;
    state.player.seekTo(target, true);
    state.suppressPlayerEvents = false;
  }

  const ytState = state.player.getPlayerState();
  const playingNow = ytState === YT.PlayerState.PLAYING;
  if (Boolean(remote.playing) !== playingNow) {
    state.suppressPlayerEvents = true;
    remote.playing ? state.player.playVideo() : state.player.pauseVideo();
    state.suppressPlayerEvents = false;
  }
}

const sendHostSync = (patch) => isHost() && wsSend({ type: "sync", patch });

function recordLatencySample(rttMs) {
  if (!Number.isFinite(rttMs) || rttMs < 0 || rttMs > 5000) return;
  if (state.latencyMs <= 0) {
    state.latencyMs = rttMs;
    return;
  }
  if (rttMs > state.latencyMs * LATENCY_OUTLIER_FACTOR && state.latencyMs > 50) return;
  state.latencyMs = (1 - LATENCY_EMA_ALPHA) * state.latencyMs + LATENCY_EMA_ALPHA * rttMs;
}

function startLatencyPings() {
  setInterval(() => {
    if (state.joined) wsSend({ type: "ping", ts: Date.now() });
  }, LATENCY_PING_MS);
}

// ---------------------------------------------------------------------------
// WebSocket lifecycle (with reconnect backoff)
// ---------------------------------------------------------------------------

function connect(roomId) {
  closeSocket(true);
  state.reconnect = { attempts: 0, timer: null, intentional: false };
  state.roomId = roomId;
  history.replaceState(null, "", getRoomInviteUrl(roomId));
  openSocket();
}

function closeSocket(intentional) {
  state.reconnect.intentional = Boolean(intentional);
  if (state.reconnect.timer) {
    clearTimeout(state.reconnect.timer);
    state.reconnect.timer = null;
  }
  if (state.ws && state.ws.readyState <= WebSocket.OPEN) {
    state.ws.close();
  }
}

function scheduleReconnect() {
  if (state.reconnect.intentional) return;
  const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** state.reconnect.attempts);
  state.reconnect.attempts += 1;
  setStatus(`Disconnected. Retrying in ${Math.round(delay / 1000)}s...`);
  state.reconnect.timer = setTimeout(openSocket, delay);
}

function openSocket() {
  state.ws = new WebSocket(BACKEND_WS_URL);

  state.ws.addEventListener("open", () => {
    state.joined = true;
    state.reconnect.attempts = 0;
    wsSend({ type: "join", roomId: state.roomId, clientId: state.clientId, username: state.username });
    setStatus(`Connected to room "${state.roomId}"`);
    beHostBtn.disabled = false;
    updateLoadButtonState();
    roomHintEl.textContent = "Room connected. Subscribers can now chat and watch together in sync.";
  });

  state.ws.addEventListener("close", () => {
    state.joined = false;
    state.userCount = 0;
    updateRoomMeta();
    beHostBtn.disabled = true;
    loadVideoBtn.disabled = true;
    if (state.reconnect.intentional) {
      setStatus("Disconnected");
      roomHintEl.textContent = "Tip: scheduled shows already generate a room link, so subscribers can join in one tap.";
      return;
    }
    scheduleReconnect();
  });

  state.ws.addEventListener("error", () => setStatus(`WebSocket failed: ${BACKEND_WS_URL}`));

  state.ws.addEventListener("message", (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    handleServerMessage(msg);
  });
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case "room_state":
      state.hostId = msg.hostId;
      if (typeof msg.userCount === "number") state.userCount = msg.userCount;
      setStatus(`Connected. Host: ${state.hostId === state.clientId ? "You" : "Another user"}`);
      updateRoomMeta();
      updateLoadButtonState();
      applyRemoteState(msg.state);
      return;
    case "user_count":
      if (typeof msg.count === "number") {
        state.userCount = msg.count;
        updateRoomMeta();
      }
      return;
    case "host_changed":
      state.hostId = msg.hostId;
      setStatus(`Host changed: ${msg.hostId === state.clientId ? "You are host" : "Another user"}`);
      updateLoadButtonState();
      return;
    case "sync":
    case "tick":
      if (!isHost()) applyRemoteState(msg.state);
      return;
    case "pong":
      if (typeof msg.ts === "number") recordLatencySample(Date.now() - msg.ts);
      return;
    case "chat":
      if (typeof msg.clientId === "string" && typeof msg.text === "string") {
        appendChatMessage(msg);
      }
      return;
  }
}

// ---------------------------------------------------------------------------
// YouTube IFrame player
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// REST API + dashboard rendering
// ---------------------------------------------------------------------------

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
  const params = new URLSearchParams({ clientId: state.clientId, username: state.username });
  const payload = await api(`/api/app-state?${params.toString()}`);
  state.appData = payload;
  if (payload.viewer?.displayName) {
    state.username = payload.viewer.displayName;
    localStorage.setItem("syncb.username", state.username);
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
  channelGenresInputEl.value = (viewer.channelGenres || []).join(", ");
}

const renderEmpty = (message) => `<div class="emptyState">${escapeHtml(message)}</div>`;
const parseGenresInput = (value) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
const getAllShows = () => [...state.appData.hostUpcoming, ...state.appData.subscriberUpcoming]
  .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

function getGenreSummary() {
  const counts = new Map();
  for (const show of getAllShows()) {
    for (const genre of show.genres || []) counts.set(genre, (counts.get(genre) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([genre, count]) => ({ genre, count }));
}

function getFeaturedShows() {
  return getAllShows()
    .map((show) => ({
      ...show,
      audienceScore: Number(show.estimatedAudience || 0) + (show.genres || []).length * 3
    }))
    .sort((a, b) => b.audienceScore - a.audienceScore || new Date(a.scheduledFor) - new Date(b.scheduledFor));
}

const formatGenres = (genres = []) => genres.length
  ? genres.map((genre) => `<span class="genreTag">${escapeHtml(genre)}</span>`).join("")
  : `<span class="genreTag">Community</span>`;

function renderIdentityCard() {
  const viewer = state.appData.viewer;
  if (!viewer) return;
  identityCardEl.innerHTML = `<p class="identityName">${escapeHtml(viewer.displayName || state.username)}</p><p class="identityMeta">${state.appData.subscriptions.length} subscriptions - ${viewer.subscriberCount || 0} subscribers</p>`;
}

function renderHeroStats() {
  const featured = getFeaturedShows();
  const totalAudience = featured.reduce((sum, show) => sum + (show.estimatedAudience || 0), 0);
  heroStatsEl.innerHTML = `<div class="miniMetric"><p class="metricValue">${featured.length}</p><p class="metricLabel">Upcoming drops</p></div><div class="miniMetric"><p class="metricValue">${state.appData.channels.length}</p><p class="metricLabel">Active channels</p></div><div class="miniMetric"><p class="metricValue">${getGenreSummary().length}</p><p class="metricLabel">Genres live</p></div><div class="miniMetric"><p class="metricValue">${totalAudience}</p><p class="metricLabel">Projected viewers</p></div>`;
}

function renderHeroFeaturedShow() {
  const show = getFeaturedShows()[0];
  if (!show) {
    heroFeaturedShowEl.innerHTML = renderEmpty("Create your first event to light up the hero spotlight.");
    return;
  }
  heroFeaturedShowEl.innerHTML = `<p class="cardTitle">${escapeHtml(show.title)}</p><p class="cardMeta">${escapeHtml(show.channelName)} - ${escapeHtml(formatDate(show.scheduledFor))}</p><p class="cardCopy">${escapeHtml(show.description || "A premium shared watch event.")}</p><div class="genrePills">${formatGenres(show.genres)}</div><div class="listActions"><button data-action="join-show" data-show-id="${escapeHtml(show.id)}">Join event</button><button class="ghostButton" data-action="copy-link" data-show-id="${escapeHtml(show.id)}">Copy link</button></div>`;
}

function renderGenreRail() {
  const genres = getGenreSummary().slice(0, 6);
  genreRailEl.innerHTML = genres.length
    ? genres.map(({ genre, count }) => `<span class="pill">${escapeHtml(genre)} ${count}</span>`).join("")
    : renderEmpty("Your genres will show up here once you start creating and following events.");
}

function renderSpotlightRail() {
  const viewer = state.appData.viewer;
  const top = state.appData.channels[0];
  const items = [
    { title: `${state.appData.subscriptions.length} following`, meta: "Channels you are tracking" },
    { title: `${state.appData.alerts.length} alerts`, meta: "Fresh creator notifications" },
    {
      title: top ? top.channelName : `${viewer?.subscriberCount || 0} subscribers`,
      meta: top ? `${top.subscribers} subscribers leading now` : "Audience on your channel"
    }
  ];
  spotlightRailEl.innerHTML = items.map((item) =>
    `<div class="miniMetric"><p class="metricValue">${escapeHtml(item.title)}</p><p class="metricLabel">${escapeHtml(item.meta)}</p></div>`
  ).join("");
}

function renderMyChannelCard() {
  const viewer = state.appData.viewer;
  if (!viewer?.channelName) {
    myChannelCardEl.innerHTML = renderEmpty("Turn on your host channel to start publishing genre-based events.");
    return;
  }
  myChannelCardEl.innerHTML = `<div class="channelCard"><div class="cardTop"><div><p class="cardTitle">${escapeHtml(viewer.channelName)}</p><p class="cardCopy">${escapeHtml(viewer.channelTagline || "Your personal watch channel is live.")}</p></div><span class="pill live">Creator ready</span></div><div class="genrePills">${formatGenres(viewer.channelGenres || [])}</div><p class="listMeta">${viewer.subscriberCount || 0} subscribers - ${state.appData.hostUpcoming.length} upcoming events</p></div>`;
}

function renderChannels() {
  const channels = state.appData.channels;
  if (!channels.length) {
    channelDirectoryEl.innerHTML = renderEmpty("No host channels yet. Be the first creator in this space.");
    return;
  }
  channelDirectoryEl.innerHTML = channels.slice(0, 6).map((channel) => {
    const subscribed = state.appData.subscriptions.includes(channel.id);
    const isMine = channel.id === state.clientId;
    return `<div class="channelCard"><div class="cardTop"><div><p class="cardTitle">${escapeHtml(channel.channelName || channel.displayName)}</p><p class="cardMeta">${channel.subscribers} subscribers - ${channel.upcomingCount} upcoming</p></div><span class="pill">${escapeHtml((channel.genres || [channel.displayName]).slice(0, 2).join(" / "))}</span></div><p class="cardCopy">${escapeHtml(channel.channelTagline || "Join this host for scheduled community watch sessions.")}</p><div class="genrePills">${formatGenres(channel.genres || [])}</div><div class="cardActions">${isMine ? `<button class="ghostButton" data-tab-target="create">Open studio</button>` : `<button data-action="${subscribed ? "unsubscribe" : "subscribe"}" data-host-id="${escapeHtml(channel.id)}">${subscribed ? "Subscribed" : "Subscribe"}</button>`}</div></div>`;
  }).join("");
}

function renderAlerts() {
  const alerts = state.appData.alerts;
  if (!alerts.length) {
    alertsFeedEl.innerHTML = renderEmpty("Host alerts will land here when channels you follow announce a show.");
    return;
  }
  alertsFeedEl.innerHTML = alerts.map((alert) =>
    `<div class="listCard"><div class="cardTop"><div><p class="listTitle">${escapeHtml(alert.channelName)}</p><p class="listMeta">${escapeHtml(relativeTime(alert.createdAt))}</p></div><span class="pill">${escapeHtml(alert.showTitle || "Update")}</span></div><p class="cardCopy">${escapeHtml(alert.message)}</p><p class="noticeText">Delivery: ${escapeHtml(alert.deliverySummary)}</p></div>`
  ).join("");
}

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return !h ? `${m}m` : !m ? `${h}h` : `${h}h ${m}m`;
};

function buildShowCard(show, { canAlert = false, actionLabel = "Join room", action = "join-show", secondaryAction = "" } = {}) {
  const viewers = show.estimatedAudience || 0;
  return `<article class="videoCard"><div class="videoThumb"><div class="thumbPlay">&gt;</div><div class="thumbAudience">${viewers} watching</div><div class="thumbDuration">${escapeHtml(formatDuration(show.durationMinutes))}</div></div><div class="videoMetaRow"><div><p class="cardTitle">${escapeHtml(show.title)}</p><p class="cardMeta">${escapeHtml(show.channelName)} - ${escapeHtml(formatDate(show.scheduledFor))} - ${escapeHtml(relativeTime(show.scheduledFor))}</p></div><span class="pill">${escapeHtml(show.roomId)}</span></div><p class="cardCopy">${escapeHtml(show.description || "Scheduled community watch session.")}</p><div class="genrePills">${formatGenres(show.genres)}</div><div class="listActions"><button data-action="${action}" data-show-id="${escapeHtml(show.id)}">${actionLabel}</button><button class="ghostButton" data-action="copy-link" data-show-id="${escapeHtml(show.id)}">Copy link</button>${secondaryAction}${canAlert ? `<button class="ghostButton" data-action="alert-show" data-show-id="${escapeHtml(show.id)}">Alert audience</button>` : ""}</div></article>`;
}

function renderFeaturedFeed() {
  const featured = getFeaturedShows().slice(0, 4);
  featuredFeedEl.innerHTML = featured.length
    ? featured.map((show) => buildShowCard(show, { actionLabel: "Open event" })).join("")
    : renderEmpty("Follow channels or create events to build your home feed.");
}

function renderGenreFilters() {
  const items = [{ genre: "all", count: getAllShows().length }, ...getGenreSummary().slice(0, 8)];
  feedGenreFiltersEl.innerHTML = items.map(({ genre, count }) =>
    `<button class="filterChip ${state.feedGenre === genre ? "isActive" : ""}" type="button" data-feed-genre="${escapeHtml(genre)}">${escapeHtml(genre === "all" ? "All" : genre)} ${count}</button>`
  ).join("");
}

function getFilteredFeedShows() {
  const shows = state.appData.subscriberUpcoming.length
    ? state.appData.subscriberUpcoming
    : getFeaturedShows();
  return state.feedGenre === "all" ? shows : shows.filter((show) => (show.genres || []).includes(state.feedGenre));
}

function renderUpcomingLists() {
  const filtered = getFilteredFeedShows();
  subscriberUpcomingEl.innerHTML = filtered.length
    ? filtered.map((show) => buildShowCard(show)).join("")
    : renderEmpty("No events match this genre yet. Try another filter or subscribe to more channels.");

  hostUpcomingEl.innerHTML = state.appData.hostUpcoming.length
    ? state.appData.hostUpcoming.map((show) => buildShowCard(show, {
      canAlert: true,
      secondaryAction: `<button class="ghostButton" data-action="prefill-show-room" data-show-id="${escapeHtml(show.id)}">Load into studio</button>`
    })).join("")
    : renderEmpty("Create a scheduled event and it will appear here with a ready-made room link.");

  const quick = getFeaturedShows().slice(0, 3);
  quickJoinListEl.innerHTML = quick.length
    ? quick.map((show) =>
      `<div class="listCard"><p class="listTitle">${escapeHtml(show.title)}</p><p class="listMeta">${escapeHtml(show.channelName)} - ${escapeHtml(relativeTime(show.scheduledFor))}</p><p class="noticeText">${show.estimatedAudience || 0} expected viewers</p><div class="listActions"><button data-action="join-show" data-show-id="${escapeHtml(show.id)}">Open room</button></div></div>`
    ).join("")
    : renderEmpty("Your next rooms will show up here for one-tap access.");
}

function renderDashboard() {
  renderIdentityCard();
  renderHeroStats();
  renderHeroFeaturedShow();
  renderGenreRail();
  renderSpotlightRail();
  renderFeaturedFeed();
  renderMyChannelCard();
  renderChannels();
  renderAlerts();
  renderGenreFilters();
  renderUpcomingLists();
  applyTheme();
}

// ---------------------------------------------------------------------------
// Forms + actions
// ---------------------------------------------------------------------------

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
  const result = await api("/api/profile", { method: "POST", body: JSON.stringify(payload) });
  state.username = result.viewer.displayName;
  localStorage.setItem("syncb.username", state.username);
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
      channelTagline: channelTaglineInputEl.value.trim(),
      channelGenres: parseGenresInput(channelGenresInputEl.value)
    })
  });
  await loadAppData();
  setStatus("Host channel updated.");
}

async function createShow(event) {
  event.preventDefault();
  const roomId = showRoomInputEl.value.trim() || slugify(showTitleInputEl.value.trim());
  await api("/api/shows", {
    method: "POST",
    body: JSON.stringify({
      clientId: state.clientId,
      title: showTitleInputEl.value.trim(),
      scheduledFor: showDateInputEl.value,
      durationMinutes: Number(showDurationInputEl.value) || 90,
      roomId,
      videoId: parseVideoId(showVideoInputEl.value),
      genres: parseGenresInput(showGenresInputEl.value),
      description: showDescriptionInputEl.value.trim()
    })
  });
  showFormEl.reset();
  showDurationInputEl.value = "90";
  await loadAppData();
  setStatus("Scheduled event created.");
  setActiveTab("create");
}

const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const subscribe = (hostId) => api("/api/subscribe", {
  method: "POST",
  body: JSON.stringify({ clientId: state.clientId, hostId })
}).then(loadAppData);

const unsubscribe = (hostId) => api("/api/unsubscribe", {
  method: "POST",
  body: JSON.stringify({ clientId: state.clientId, hostId })
}).then(loadAppData);

async function sendShowAlert(showId) {
  await api(`/api/shows/${encodeURIComponent(showId)}/alert`, {
    method: "POST",
    body: JSON.stringify({ clientId: state.clientId })
  });
  await loadAppData();
  setStatus("Subscribers alerted.");
}

const findShowById = (showId) => [...state.appData.hostUpcoming, ...state.appData.subscriberUpcoming]
  .find((show) => show.id === showId) || null;

async function copyShowLink(showId) {
  const show = findShowById(showId) || getFeaturedShows().find((item) => item.id === showId);
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
  videoInput.value = show.videoId || "";
  roomHintEl.textContent = `${show.title} is ready in room "${show.roomId}".`;
}

function joinScheduledShow(showId) {
  const show = findShowById(showId) || getFeaturedShows().find((item) => item.id === showId);
  if (!show) return;
  prepareRoom(show);
  setActiveTab("watch");
  connect(show.roomId);
}

function prefillShowRoom(showId) {
  const show = state.appData.hostUpcoming.find((item) => item.id === showId);
  if (!show) return;
  prepareRoom(show);
  showTitleInputEl.value = show.title;
  showRoomInputEl.value = show.roomId;
  showVideoInputEl.value = show.videoId || "";
  showGenresInputEl.value = (show.genres || []).join(", ");
  showDescriptionInputEl.value = show.description || "";
  setStatus(`Loaded "${show.title}" into the studio controls.`);
}

function setActiveTab(tab) {
  state.activeTab = tab;
  tabButtons.forEach((button) => button.classList.toggle("isActive", button.dataset.tab === tab));
  views.forEach((view) => view.classList.toggle("isVisible", view.dataset.view === tab));
  if (heroSectionEl) heroSectionEl.style.display = tab === "home" ? "" : "none";
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  themeToggleBtn.textContent = state.theme === "dark" ? "Light" : "Dark";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("syncb.theme", state.theme);
  applyTheme();
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

channelDirectoryEl.addEventListener("click", async (event) => {
  const target = event.target.closest("button[data-action]");
  if (!target) return;
  if (target.dataset.action === "subscribe" && target.dataset.hostId) await subscribe(target.dataset.hostId);
  if (target.dataset.action === "unsubscribe" && target.dataset.hostId) await unsubscribe(target.dataset.hostId);
});

document.addEventListener("click", async (event) => {
  const tabTarget = event.target.closest("[data-tab-target]");
  if (tabTarget) {
    setActiveTab(tabTarget.dataset.tabTarget);
    return;
  }
  const genreButton = event.target.closest("[data-feed-genre]");
  if (genreButton) {
    state.feedGenre = genreButton.dataset.feedGenre;
    renderGenreFilters();
    renderUpcomingLists();
    return;
  }
  const target = event.target.closest("button[data-action]");
  if (!target) return;
  const { action, showId } = target.dataset;
  if (action === "join-show" && showId) joinScheduledShow(showId);
  if (action === "copy-link" && showId) await copyShowLink(showId);
  if (action === "alert-show" && showId) await sendShowAlert(showId);
  if (action === "prefill-show-room" && showId) prefillShowRoom(showId);
});

tabButtons.forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab)));
themeToggleBtn.addEventListener("click", toggleTheme);
profileFormEl.addEventListener("submit", (event) => saveProfile(event).catch((error) => setStatus(error.message)));
channelFormEl.addEventListener("submit", (event) => saveChannel(event).catch((error) => setStatus(error.message)));
showFormEl.addEventListener("submit", (event) => createShow(event).catch((error) => setStatus(error.message)));

joinBtn.addEventListener("click", () => {
  const roomId = roomIdEl.value.trim();
  if (!roomId) {
    setStatus("Enter a room id.");
    return;
  }
  connect(roomId);
});

beHostBtn.addEventListener("click", () => wsSend({ type: "set_host" }));

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
  sendHostSync({ videoId, playing: true, currentTime: 0, playbackRate: 1 });
});

function sendChat() {
  const text = chatInputEl.value.trim();
  if (!text || !state.joined) return;
  wsSend({ type: "chat", text });
  chatInputEl.value = "";
}

sendChatBtn.addEventListener("click", sendChat);
chatInputEl.addEventListener("keydown", (event) => { if (event.key === "Enter") sendChat(); });

inviteBtn.addEventListener("click", async () => {
  const room = state.roomId || roomIdEl.value.trim();
  if (!room) {
    setStatus("Enter or join a room first.");
    return;
  }
  const inviteUrl = getRoomInviteUrl(room);
  try {
    if (navigator.share) {
      await navigator.share({ title: "Join my SyncTube room", text: `Join room: ${room}`, url: inviteUrl });
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

// On tab visibility resume, request immediate sync (catches up faster than
// waiting for the next server tick).
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.joined && !isHost()) {
    wsSend({ type: "sync_request" });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

startLatencyPings();
updateRoomMeta();
applyTheme();
setActiveTab(state.activeTab);

const initialRoom = new URLSearchParams(location.search).get("room");
if (initialRoom) {
  roomIdEl.value = initialRoom;
  setActiveTab("watch");
}

loadAppData()
  .then(() => { if (initialRoom) joinBtn.click(); })
  .catch((error) => setStatus(error.message));
