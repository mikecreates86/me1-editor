# Status

Last verified: 2026-09-17. See [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) for
the complete handoff.

## Working Now

- The active product is the static client-side ME-1 preset editor in `app/`.
- `index.html` → `app/static-main.tsx` → `app/ME1Editor.tsx` is the deployed
  entry path; parsing and generation remain browser-only.
- `PROJECT_CONTEXT.md` is the primary cold-handoff document.
- `README_AI.md` and `AGENTS.md` provide orientation and coding-agent rules.
- `docs/README.md` indexes the focused ME-1 format note.

## Recently Completed

- Audited the repository and Git history for a portable handoff.
- Verified a clean lockfile install, lint, Vite production build, and all four
  active smoke tests.
- Added a pinned Node version and GitHub Actions checks for pushes and pull
  requests to `main`.
- Replaced the stale starter README with current project instructions.

- Added root-level AI session notes covering architecture, format constraints,
  runtime scaffolding, and development state.
- Added root-level agent instructions covering protected binary data, commands,
  conventions, and verification expectations.
- Consolidated durable binary-layout notes into `docs/me1-format.md` and added
  ignore coverage for local captures and scratch/backup files.
- Added a Vite static entry, static smoke test, and Vercel-compatible build
  configuration without changing the editor/parser implementation.
- The latest product commit is `3db8e2d`, which added full configuration and
  source-name editing. At the 2026-09-11 audit, it matched `origin/main`.

## Known Issues

- `tests/rendered-html.test.mjs` remains obsolete starter coverage and is not in
  the active `npm test` script.
- There are no focused parser/writer round-trip or hardware-compatibility tests.
- Editor drafts can be exported but not imported.
- Unsaved configuration-slot edits are omitted if the user exports the
  configuration before choosing `SAVE & RETURN`.
- The old Vinext/Cloudflare files remain in the tree as inactive scaffold files;
  future changes should use the static Vite entry unless explicitly migrating
  or deleting the scaffold.

## Next Steps

- Replace the stale starter test with focused tests for 4 KB/72 KB parsing,
  export size, round-tripping, and preservation of unknown bytes.
- Validate generated files on physical hardware and record ME-1 firmware.
- Verify the Vercel deployment and static output.
- Run the app manually and verify import, editing, group/mute behavior, draft
  export, `.ME1` export, and the macOS USB helper as applicable.
