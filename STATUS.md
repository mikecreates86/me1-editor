# Status

## Working Now

- The active product is the static client-side ME-1 preset editor in `app/`.
- `index.html` → `app/static-main.tsx` → `app/ME1Editor.tsx` is the deployed
  entry path; parsing and generation remain browser-only.
- `README_AI.md` and `AGENTS.md` now provide project and coding-agent guidance.
- `docs/README.md` indexes the focused ME-1 format note.

## Recently Completed

- Added root-level AI session notes covering architecture, format constraints,
  runtime scaffolding, and development state.
- Added root-level agent instructions covering protected binary data, commands,
  conventions, and verification expectations.
- Consolidated durable binary-layout notes into `docs/me1-format.md` and added
  ignore coverage for local captures and scratch/backup files.
- Added a Vite static entry, static smoke test, and Vercel-compatible build
  configuration without changing the editor/parser implementation.
- Initialized Git on `main` and created commit `904508c` after restoring
  dependencies and verifying the static build/tests.

## Known Issues

- The existing `node_modules` tree is incomplete/broken; reinstall dependencies
  before treating build/lint failures as source failures.
- `tests/rendered-html.test.mjs` remains obsolete starter coverage and is not in
  the active `npm test` script.
- There are no focused parser/writer round-trip or hardware-compatibility tests.
- The old Vinext/Cloudflare files remain in the tree as inactive scaffold files;
  future changes should use the static Vite entry unless explicitly migrating
  or deleting the scaffold.

## Next Steps

- Restore dependencies with a clean, lockfile-based install and run build,
  smoke tests, lint, and preview.
- Replace the stale starter test with focused tests for 4 KB/72 KB parsing,
  export size, round-tripping, and preservation of unknown bytes.
- Add the GitHub remote for `me1-editor`, authenticate, push `main`, and verify
  the Vercel static output.
- Run the app manually and verify import, editing, group/mute behavior, draft
  export, `.ME1` export, and the macOS USB helper as applicable.
