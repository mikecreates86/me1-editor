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
npm ci             # install exact dependency versions
npm run dev        # start a local development server
npm run build      # production build into dist/
npm test           # build, then run the automated tests
npm run lint       # code style and common-mistake checks
npm run typecheck  # TypeScript type checks
```

The application is static React/Vite. File parsing and downloads stay in the
browser; there is no server, database, or account.

New to the GitHub workflow used here? See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Important safety rules

- Do not modify files under `Configs/` or embedded template bytes casually.
- Preset files are exactly 4,096 bytes. Configuration files are exactly 73,728
  bytes.
- Preserve unknown bytes from imported files.
- Read [`docs/me1-format.md`](docs/me1-format.md) before changing binary logic.

## Deployment

Build with `npm run build` and publish `dist/` as a static site. No backend
service or credentials are required by the app.

GitHub Actions runs lint, typecheck, and the build/test suite for pushes and
pull requests to `main`. A clean clone contains everything needed for those checks.
