# AGENTS.md

Operational guidance for AI coding agents working in this repository. Keep
project background and product history in [`README_AI.md`](README_AI.md).

## Before editing

- Read [`README_AI.md`](README_AI.md), [`package.json`](package.json), and the
  relevant files under [`app/`](app/).
- Treat the ME-1 binary format as compatibility-sensitive. Understand the
  parser/writer changes in [`app/me1-format.ts`](app/me1-format.ts) before
  changing them.
- Check the working tree first and preserve unrelated user changes.

## Repository layout

- `app/`: active React UI, CSS, format implementation, and optional auth helper.
- `index.html`, `app/static-main.tsx`, `vite.config.ts`: authoritative static
  Vite entry and Vercel build configuration.
- `worker/`, `.openai/hosting.json`: retained inactive starter scaffold; do not
  reintroduce it into the deployed path.
- `Configs/`: binary ME-1 reference/configuration/preset fixtures.
- `tests/static-app.test.mjs`: current static-build smoke tests. The older
  `tests/rendered-html.test.mjs` is obsolete starter coverage.
- `db/`, `examples/d1/`, `drizzle/`: inactive D1/Drizzle starter scaffolding.
- `public/`: static assets.
- `docs/`: focused durable technical notes; start with `docs/README.md`.

## Commands

Use Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
npm run lint
npm run db:generate
```

`npm test` runs the static Vite build first, then `tests/static-app.test.mjs`.
`npm run db:generate` is only relevant when intentionally adding D1 schema.
If a command is unavailable, verify dependencies are installed before changing
configuration. Report failures accurately; do not claim a successful build or
test run without output.

## Coding conventions

- TypeScript/TSX with strict type checking and ES modules; keep public types
  explicit and avoid weakening `tsconfig.json`.
- Follow the existing React function-component style. `ME1Editor.tsx` is a
  client component; browser-only file and Blob APIs belong there or in clearly
  client-safe helpers.
- Keep UI state local unless a real shared state requirement appears. Preserve
  existing accessibility labels and native controls when editing the UI.
- Match the existing CSS approach in `app/globals.css`; there is no formatter
  or application-specific test framework configured.
- Prefer small, focused changes. Do not reformat large files or rewrite the
  embedded binary strings as part of unrelated work.

## Files/data to protect

- Do not modify `Configs/**/*.ME1` or the base64 constants in
  `app/me1-template.ts` unless the task is explicitly about fixture/template
  bytes and the change is validated against hardware/reference data.
- Do not commit generated or local state: `node_modules/`, `.next/`, `.vinext/`,
  `dist/`, `.wrangler/`, `outputs/`, `work/`, `.env*`, or `.DS_Store`.
- Do not turn on D1/R2, add auth, or wire the D1 example merely to complete an
  unrelated editor task. Those are currently inactive scaffolding paths.
- Keep the deployed path static: do not import `worker/`, `db/`,
  `app/chatgpt-auth.ts`, `@openai/sites-vite-plugin`, or Cloudflare bindings
  from the Vite entry.
- Preserve the macOS-only behavior and safety checks in
  `Copy to ME-1 USB.command`; changes to USB copying must retain filename,
  4 KB-size, byte-for-byte verification, and eject safeguards.

## ME-1 format rules

- Accepted input sizes are exactly 4096 or 73728 bytes; configuration imports
  are edited from their first 4096 bytes.
- Exports must remain 4096 bytes. Preserve unknown bytes from imported files.
- Keep the 16-key/40-source model, fixed offsets, and level/pan encoding unless
  the task explicitly changes the format contract.
- Read [`docs/me1-format.md`](docs/me1-format.md) for the authoritative
  implementation notes before changing binary logic.
- When changing format behavior, add focused round-trip tests using fixtures
  under `Configs/` before relying on the stale starter test.

## Verification checklist

After code changes:

1. Run `npm run lint` and `npm run build`.
2. Run `npm test`, but distinguish stale-test failures from regressions.
3. For format changes, test 4 KB and 72 KB imports, export size, filename
   constraints, and unchanged-byte preservation.
4. For UI changes, run `npm run dev` and manually verify import, edit, draft
   export, `.ME1` export, group editing, mute, and responsive layout as relevant.
5. Summarize commands run and any environment or pre-existing failures.
