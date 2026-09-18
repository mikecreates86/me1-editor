# ME Preset Lab

A browser-only editor for Allen & Heath ME-1 personal mixer preset and
configuration files. It can create or import presets, edit all 16 keys, manage
groups and source labels, and export 4 KB presets or complete 72 KB device
configurations.

For project history, constraints, verified status, risks, and next steps, read
[`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md). Coding agents must also read
[`AGENTS.md`](AGENTS.md).

## Prerequisites

- Node.js 22.13.0 or newer

## Run locally

```bash
npm ci
npm run dev
npm run build
npm test
npm run lint
```

The active application is static React/Vite. File parsing and downloads stay in
the browser. The repository contains inactive Vinext, Next.js, Cloudflare, D1,
and auth starter files; they are not part of the deployed application.

## Important safety rules

- Do not modify files under `Configs/` or embedded template bytes casually.
- Preset files are exactly 4,096 bytes. Configuration files are exactly 73,728
  bytes.
- Preserve unknown bytes from imported files.
- Read [`docs/me1-format.md`](docs/me1-format.md) before changing binary logic.

## Deployment

Build with `npm run build` and publish `dist/` as a static site. No backend
service or credentials are required by the app.

GitHub Actions runs lint and the active build/test suite for pushes and pull
requests to `main`. A clean clone contains everything needed for those checks.
