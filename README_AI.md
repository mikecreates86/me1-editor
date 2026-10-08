# AI session entry point

The authoritative cold-handoff document is
[`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md). Read it first, then
[`AGENTS.md`](AGENTS.md). This file is a shorter orientation, not the complete
status record.

## Purpose

ME Preset Lab is a browser-only editor for Allen & Heath ME-1 personal-mixer
preset and configuration files. It edits 16 keys, levels, pan, mute state,
groups, key names, 16-preset configurations, and editor-only source labels.
`Copy to ME-1 USB.command` copies a 4 KB preset to a mounted ME1 USB drive and
verifies/ejects it.

## Current architecture

- Static React/Vite app; [`index.html`](index.html) mounts
  [`app/static-main.tsx`](app/static-main.tsx), which renders
  [`app/ME1Editor.tsx`](app/ME1Editor.tsx).
- [`app/me1-format.ts`](app/me1-format.ts) owns the binary parser/writer,
  level/pan conversion, group membership, and JSON draft export.
- [`app/me1-template.ts`](app/me1-template.ts) embeds validated base-device
  bytes and a clean input-key template as base64; no server persistence is used.
- [`vite.config.ts`](vite.config.ts) contains the static Vite build; output is
  `dist/`.

## Important files/directories

- [`app/`](app/): UI, styling, and format logic.
- [`Configs/`](Configs/): reference 72 KB configuration files and 4 KB preset
  fixtures from ME-1 hardware/research.
- [`Copy to ME-1 USB.command`](Copy%20to%20ME-1%20USB.command): macOS USB helper.
- [`public/`](public/): favicon; [`me1top.webp`](me1top.webp) is an unused
  image of the device.
- [`index.html`](index.html), [`vite.config.ts`](vite.config.ts): static
  deployment setup.

## Run, test, and build

Prerequisite: Node.js `>=22.13.0`.

```bash
npm install
npm run dev       # local Vite development server
npm run build     # production build
npm test          # build, then run the smoke and format tests
npm run lint
npm run typecheck
```

Vercel can use `npm run build` with `dist` as the output directory. The app has
no server routes, API calls, or database/runtime binding.

## External services/APIs

The deployed app uses no external service/API. File reads, parsing, and
downloads happen in the browser.

## Constraints and technical decisions

- Inputs are exactly 4 KB presets or 72 KB configurations. Preset exports are
  4 KB; configuration exports are the full 72 KB.
- Imported unknown bytes are preserved. The parser/writer layout and encoding
  decisions are recorded in [`docs/me1-format.md`](docs/me1-format.md).
- The USB helper is macOS-specific and requires a volume named `ME1` and an
  `ME1PST` directory.
- Treat [`Configs/`](Configs/) and the embedded template bytes as validated
  reference data; do not replace them casually.

## Known problems / verification gaps

- `tests/me1-format.test.mjs` runs parser/writer round trips against the
  fixtures; `npm run typecheck` checks the whole project.
- There are no hardware-compatibility tests.
- The UI currently supports importing `.ME1` files but not importing its saved
  `.me1draft.json` format, despite offering draft export.

## Development state

The main editor UI and binary research implementation are present, including
group editing, custom names, import/export, and the USB handoff helper. The
original Vinext/Cloudflare/D1 starter scaffold was removed on 2026-10-08.
Treat the ME-1 format implementation and the reference/config fixture bytes as
the product surface.
