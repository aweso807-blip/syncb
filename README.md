# SyncTube

Two users can watch the same YouTube video in synchronized playback across separate devices.

## Local Run

1. `npm install`
2. `npm start`
3. Open `http://localhost:3000`

## Render Deployment (Backend)

This repo already includes:
- `Dockerfile`
- `render.yaml`

### Use a different Git account

Run these commands from `d:\SyncB` after switching to your other Git account credentials on your machine:

```powershell
git init
git add .
git commit -m "Initial SyncTube"
git branch -M main
git remote add origin https://github.com/<YOUR_OTHER_ACCOUNT>/<YOUR_REPO>.git
git push -u origin main
```

### Deploy backend on Render (free plan)

1. Open Render dashboard.
2. Create `New +` -> `Web Service`.
3. Connect the GitHub repo from your other account.
4. Render will detect `render.yaml`; deploy it.
5. Copy backend URL, for example: `https://syncb-backend.onrender.com`

Use this WebSocket URL in the frontend:
- `wss://syncb-backend.onrender.com`

## Frontend

Current frontend is live at:
- `https://syncb-watch.vercel.app`

In the app, paste the Render backend URL in `WebSocket Server URL` and join a room on both devices.

## Notes

- Free Render services may sleep when idle, so first request can be slow.
- True zero-delay sync is not physically possible over internet links, but this app keeps clients closely aligned.
