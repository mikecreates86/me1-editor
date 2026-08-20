# AI Session Notes

## Purpose

ME Preset Lab is a browser-only editor for Allen & Heath ME-1 personal-mixer
preset files. It lets a user create or import a `.ME1`, edit 16 keys, levels,
pan, mute state, groups, and key names, then export a hardware-compatible 4 KB
preset. `Copy to ME-1 USB.command` copies an exported preset to a mounted ME1
USB drive and verifies/ejects it.

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

- [`app/`](app/): UI, styling, format logic, and optional ChatGPT auth helpers.
- [`Configs/`](Configs/): reference 72 KB configuration files and 4 KB preset
  fixtures from ME-1 hardware/research.
- [`Copy to ME-1 USB.command`](Copy%20to%20ME-1%20USB.command): macOS USB helper.
- [`public/`](public/): favicon and starter assets; [`me1top.webp`](me1top.webp)
  is an image asset.
- [`db/`](db/): unused Drizzle/D1 adapter; schema is intentionally empty.
- [`examples/d1/`](examples/d1/): unconnected starter example for notes + D1.
- [`index.html`](index.html), [`vite.config.ts`](vite.config.ts): static
  deployment setup. `worker/`, `db/`, `examples/d1/`, and ChatGPT auth files
  are retained inactive scaffold files, not part of the deployed app.

## Run, test, and build

Prerequisite: Node.js `>=22.13.0`.

```bash
npm install
npm run dev       # local Vinext/Cloudflare development server
npm run build     # production build
npm test          # build, then run tests/rendered-html.test.mjs
npm run lint
npm run db:generate
```

Vercel can use `npm run build` with `dist` as the output directory. The app has
no server routes, API calls, ChatGPT Work/Sites dependency, or database/runtime
binding.

## External services/APIs

The deployed app uses no external service/API. File reads, parsing, and
downloads happen in the browser. Cloudflare/OpenAI Sites, D1, worker, and auth
files remain only as inactive legacy scaffold files.

## Constraints and technical decisions

- Inputs are exactly 4 KB presets or 72 KB configurations; only the first 4 KB
  of a configuration is edited/exported. Exports are exactly 4 KB.
- Imported unknown bytes are preserved. The parser/writer layout and encoding
  decisions are recorded in [`docs/me1-format.md`](docs/me1-format.md).
- The USB helper is macOS-specific and requires a volume named `ME1` and an
  `ME1PST` directory.
- Treat [`Configs/`](Configs/) and the embedded template bytes as validated
  reference data; do not replace them casually.

## Known problems / verification gaps

- [`tests/rendered-html.test.mjs`](tests/rendered-html.test.mjs) still asserts
  the original generic loading-skeleton starter (including files and a
  dependency no longer present); it does not test the ME-1 editor and is
  expected to fail or be obsolete after a successful build.
- Build/test status is currently unverified because the local `vinext` command
  was missing during review.
- There are no focused unit tests for `parseME1`, `writeME1`, round-tripping,
  or hardware compatibility. The checked-in fixtures are available for adding
  those tests.
- The UI currently supports importing `.ME1` files but not importing its saved
  `.me1draft.json` format, despite offering draft export.

## Development state

The main editor UI and binary research implementation are present, including
group editing, custom names, import/export, and the USB handoff helper. The
repository still contains substantial Vinext starter scaffolding and stale
starter tests/documentation. Treat the ME-1 format implementation and the
reference/config fixture bytes as the active product surface; treat D1,
ChatGPT auth, image optimization, and `examples/d1` as inactive infrastructure
until the app explicitly adopts them.
