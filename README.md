# DownNotice

> DownNotice — lightweight Electron + React tray app that monitors cloud provider status pages (RSS/Atom) and surfaces outage / degraded notifications.

## Features

- System tray icon with color states (green / yellow / red / black)
- Tray popover with quick feed summary
- Full dashboard and per-feed timeline
- Desktop notifications with deduplication
- Persistent settings (feeds, refresh interval, history hours, theme)
- Auto-start support (may be blocked by corporate policies)

## Quick Start

Prerequisites:

- Node.js (v18+ recommended)
- npm

Install dependencies:

Windows PowerShell (corporate TLS proxy workaround):

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
npm install
```

macOS / Linux:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm install
```

Run in development mode (webpack dev server + Electron):

```bash
npm run dev
```

Build renderer bundle (production):

```bash
npm run build:renderer
```

Start packaged app (after building/packaging):

```bash
npm start
```

Create distributables via electron-builder:

```bash
npm run build         # builds for all configured targets
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

## Configuration & Data

- Settings are persisted to a JSON file (see `src/main/settings.js`) and are stored in the platform-specific app data directory (Windows: `%APPDATA%/DownNotice`, macOS: `~/Library/Application Support/DownNotice`, Linux: `~/.DownNotice`).
- Default monitored feeds include GitHub, Azure, AWS, GCP, and Cloudflare; add or remove feeds from the Settings UI.

## Troubleshooting

- Blank/empty renderer window in dev: ensure `npm run dev` finished building (webpack dev server runs on `http://localhost:9000/`). The dev HTML allows `unsafe-eval` for source maps; this is only required during development.
- Feed fetch TLS errors (corporate TLS inspection): temporarily set `NODE_TLS_REJECT_UNAUTHORIZED=0` (see commands above). This disables certificate verification and is insecure — prefer adding your corporate CA to Node's trust store if possible.
- Notifications/auto-launch: on Windows, registry editing may be blocked by admin policy. The app will continue to run but auto-start may fail with a registry permission error.

## Developer Notes

- Main process code: `src/main` (tray, IPC, feed polling, notifications)
- Renderer UI: `src/renderer` (React components, styles)
- Feed parsing: `src/main/feedParser.js` — parses RSS/Atom and classifies status using the latest update marker when available.

## Contributing

Issues and pull requests are welcome. Please follow standard GitHub contribution workflow.

## License

This project is licensed under GPL-2.0 (see `package.json`).
