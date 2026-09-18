# ME Preset Lab project context

Last audited: 2026-09-17

This is the primary cold-handoff document. A new AI or developer should read
this file, then `AGENTS.md`, before changing the project. Binary implementation
details live in `docs/me1-format.md`.

## 1. Project overview

ME Preset Lab is a browser-only editor for Allen & Heath ME-1 personal mixer
files. It exists so an operator can create or edit ME-1 presets and complete
device configurations without manipulating undocumented bytes by hand.

The intended result is a reliable static web app that can:

- create or import a 4 KB `.ME1` preset;
- import a 72 KB `.ME1` device configuration;
- edit all 16 keys, including assignment, level, pan, mute, groups,
  group-member mixes, and six-character custom names;
- build and export a full 16-preset configuration;
- maintain separate friendly names for the 40 input sources;
- preserve unrecognized device bytes during export; and
- copy a finished 4 KB preset safely to an ME-1 USB drive on macOS.

Success means generated files load correctly on real ME-1 hardware, unknown or
console-specific data is not corrupted, the app needs no backend, and the
normal build and test commands pass.

## 2. Current status

### Working and completed

- The active path is static React/Vite:
  `index.html -> app/static-main.tsx -> app/ME1Editor.tsx`.
- New and imported 4 KB presets can be edited and exported.
- Imported 72 KB configurations are decoded as Preset 1/current mix plus
  Presets 2 through 16. All slots can be built or edited and exported together.
- Source-name sets can be edited and saved/loaded as editor-only JSON.
- Preset drafts can be exported as JSON.
- The writer starts with imported or validated template bytes and changes only
  recognized fields whose interpreted values changed.
- The macOS helper validates, copies, byte-compares, and ejects an ME-1 USB.
- A clean lockfile install, static build, lint, and all four active smoke tests
  passed on 2026-09-17.
- Git was clean before this documentation audit. `HEAD` and `origin/main`
  both resolved to `3db8e2dfcf83a1ad4bdfafa4a570941de628da83` on branch
  `codex/publish-config-editor`.

### Partial or outstanding

- Smoke tests check build shape and selected source-code invariants. They are
  not executable parser/writer round-trip tests.
- Real hardware compatibility was not reverified during this audit.
- The app exports `.me1draft.json` files but cannot import them.
- There is no automated browser interaction test or current recorded manual
  test of every editing flow.
- Legacy Vinext/Next, Cloudflare, D1, Drizzle, and ChatGPT-auth starter files
  remain in the repository but are inactive.

### Where work stopped

The latest product commit, `3db8e2d` from 2026-08-24, added complete 72 KB
configuration editing and editor-only source-name sets. No uncommitted product
work was present on 2026-09-11. The recommended next work is a focused binary
test suite before format changes or production use.

## 3. Requirements and constraints

### Firm requirements

- Accepted inputs are exactly 4,096 bytes (preset) or 73,728 bytes
  (configuration). Outputs must retain those exact sizes.
- A configuration contains Preset 1 plus Presets 2 through 16.
- There are exactly 16 assignable keys and 40 numbered input sources.
- Unknown bytes from imported files must survive export. Do not reconstruct a
  whole imported file only from interpreted values.
- Do not edit `Configs/**/*.ME1` or base64 constants in
  `app/me1-template.ts` without an explicit byte-level task and validation
  against hardware/reference data.
- Keep the deployed app static and browser-only. Do not connect the inactive
  worker, database, auth, or cloud bindings unless intentionally migrating.
- Preserve accessible labels and native controls when changing the UI.
- Preserve the USB helper's filename validation, 4 KB size check,
  byte-for-byte verification, metadata cleanup, and safe-eject behavior.
- Use Node.js 22.13.0 or newer and the lockfile.
- Production reliability takes priority. Make small, testable changes and do
  not weaken strict TypeScript settings.

### User working preferences

These are preferences, not binary format requirements:

- Favor simple, maintainable, proven solutions.
- Explain decisions in practical language for a technically capable project
  owner who is not the primary programmer.
- Preserve established naming, known-good behavior, and validated data.
- Identify production and hardware risk clearly.
- Give exact commands and execution locations for terminal instructions.

## 4. Important decisions

### Firm decisions

- Static Vite is authoritative. Vinext/Next/Cloudflare files are inactive
  history and must not enter the deployed path.
- Parsing, editing, and download happen locally in the browser. There is no
  runtime API, database, authentication, telemetry, or server persistence.
- Preset 1 in a configuration is the 4 KB current-mix block at offset 0.
  Additional presets begin at offset 8,192.
- The internal configuration name is also Preset 1's name. The computer/USB
  export filename is separate.
- Source-name sets are editor-only metadata. ME-1 files retain numeric inputs.
- Level conversion uses hardware-derived anchors in `docs/me1-format.md`.

### Current preferences and temporary choices

- The single-component React UI keeps state local. Add shared state machinery
  only for a concrete need.
- Legacy scaffold files remain to avoid unrelated cleanup risk. Remove them
  only in a dedicated, verified cleanup.
- The visual design intentionally resembles the ME-1 control surface and uses
  the existing handwritten CSS approach.

### Unverified assumptions

- The reverse-engineered 72 KB directory/slot model is supported by fixtures
  and current code, but lacks a dedicated fixture test and current hardware
  test record.
- Prior notes call the base template and clean key bytes hardware validated.
  The validation procedure, physical device, and firmware are not recorded.

## 5. Architecture and workflow

### Runtime and preset flow

1. Vite serves `index.html` and bundles `app/static-main.tsx`.
2. React mounts `ME1Editor` in Strict Mode and loads `app/globals.css`.
3. `ME1Editor.tsx` owns UI state and uses browser file/download APIs.
4. `app/me1-format.ts` parses bytes into typed objects and writes changes back
   into copied source/template bytes.
5. `app/me1-template.ts` supplies the base 4 KB template and clean 205-byte
   key record for new presets.
6. Export creates a local browser download. Nothing is uploaded.

`blankPreset()` builds a new 16-input preset from embedded bytes.
`parseME1()` accepts 4 KB or reads the first 4 KB of a 72 KB file. It stores
decoded values plus their original state. `writeME1()` starts from
`sourceFile.bytes` and changes only relevant flags, source, group-member,
level, pan, and name bytes.

### Configuration flow

`parseConfiguration()` retains all 73,728 bytes, parses the first block as
Preset 1, reads the directory block, and parses 15 later slots. A slot is empty
when its entire block is `0xff`. `writeConfiguration()` overlays saved
presets and directory names on imported bytes, or initializes a new file.

Slot edits are copied into the configuration only when the operator chooses
`SAVE & RETURN`. While editing a slot, `EXPORT CONFIG` exports the last saved
configuration state, so unsaved edits are omitted.

### Source-name and draft formats

- Source names use schema `me1-editor-source-names/v1`, a name, and a 40-item
  `sources` array. Imported labels are limited to 48 characters.
- Drafts use schema `me1-editor-draft/v2` with `name`, `assignments`, and
  `keyNames`. Export exists; import does not.

## 6. Environment and system information

Required:

- Node.js 22.13.0 or newer
- npm and the version-3 `package-lock.json`
- A modern browser with File, Blob, typed-array, and object-URL support

Audit environment on 2026-09-11:

- macOS 26.6.2, build 25G83, Apple arm64
- Node.js 24.19.0 and npm 11.17.0
- React 19.2.6, Vite 8.0.13, TypeScript 5.9.3, ESLint 9.39.4

Run from the repository root:

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
npm run lint
```

Vite normally serves development on port 5173 and tries another available port
when necessary. Production output is the ignored `dist/` directory.

Deployment is intended for Vercel as a static Vite site with build command
`npm run build` and output directory `dist`. Current Vercel settings and the
public deployment were not checked in this audit.

The USB helper is macOS-only. It expects `/Volumes/ME1` and writes into
`/Volumes/ME1/ME1PST`.

No secret or network access is needed to run the active app. GitHub or Vercel
credentials are needed only to push or deploy and must come from the operator's
normal authenticated tools.

## 7. Important identifiers and conventions

- Product name: `ME Preset Lab`; package name: `me1-editor`
- Git remote: `https://github.com/mikecreates86/me1-editor.git`
- ME-1 filenames: 1 to 8 uppercase letters, digits, or underscores plus
  `.ME1`; the UI normalizes input.
- Custom key name: at most 6 alphanumeric or space characters in the UI.
- UI Preset 1 is `current`; `slots[0]` is UI Preset 2.
- Assignment kinds: `input`, `group`, `auto`, `aux`, `signal`,
  `unassigned`.
- Level: 0 to 130; nominal 0 dB is 106; maximum is +10 dB.
- Pan: -100 to 100; device range 0 to 74, center 37.
- Active test: `tests/static-app.test.mjs`.
- Obsolete history: `tests/rendered-html.test.mjs`.

## 8. Project file map

- `PROJECT_CONTEXT.md`: authoritative handoff and current orientation.
- `AGENTS.md`: mandatory operational rules for coding agents.
- `README.md`: short setup guide.
- `README_AI.md` and `STATUS.md`: concise orientation and status.
- `docs/me1-format.md`: authoritative binary implementation notes.
- `app/ME1Editor.tsx`: active React UI and import/export workflow.
- `app/me1-format.ts`: types, parser, writer, and conversions.
- `app/me1-template.ts`: protected embedded binary templates.
- `app/globals.css`: active styling and responsive behavior.
- `app/static-main.tsx`, `index.html`, `vite.config.ts`: static entry/build.
- `tests/static-app.test.mjs`: active smoke tests.
- `Configs/`: protected fixtures. `Emmaus/ME1PST` contains 34 4 KB presets;
  the full tree contains three 72 KB configurations.
- `Copy to ME-1 USB.command`: protected macOS USB helper.
- `public/favicon.svg`: active favicon. Other starter SVGs and
  `me1top.webp` are unused by the static entry.
- `app/page.tsx`, `app/layout.tsx`, `app/chatgpt-auth.ts`, `worker/`,
  `db/`, `examples/d1/`, `drizzle/`, `next.config.ts`, and
  `.openai/hosting.json`: inactive scaffold. Do not import into active code.
- `node_modules/`, `dist/`, `.next/`, `.vinext/`, `outputs/`, and
  `work/`: generated/local-only state, ignored by Git.

## 9. Testing and verified findings

Verified on 2026-09-17:

```text
npm run lint   PASS, no reported issues
npm run build  PASS, static Vite output generated
npm test       PASS, 4 tests passed and 0 failed
```

The active tests verify static output, browser-side file work, absence of
runtime cloud calls in the editor, calibrated level constants/UI markers, and
configuration slot mapping/UI text.

Also verified:

- all 34 `Configs/Emmaus/ME1PST` files are 4,096 bytes;
- all three configuration fixtures are 73,728 bytes;
- Git had no changes before this documentation work; and
- `HEAD` matched the recorded local `origin/main` reference.

Reference SHA-256 fingerprints:

```text
53d6709eb8950307145194649129a53db6a6a5d085445c732cedcf4c48f3cb9f  Configs/Emmaus/ME1PST/BASE.ME1
02d6254d7d0b99cc06fc07a91e796a32ed6eb86136f1985a8d438589f6f375e5  Configs/Emmaus/ME1CFG/EMMAUS.ME1
087b1a52fcac83179e00ebf90f6e9e492589d78fe0d433f4d2185dd7c507ce54  Configs/ME1CFG/ME.ME1
fd998ebc7bde7c072b1a44971614f0c678df8423f17857045be9cfdaf74ce93d  Configs/Reference/OFFICIAL.ME1
```

Not verified in this audit:

- physical ME-1 loading and firmware compatibility;
- byte-identical no-op round trips or field-level fixture expectations;
- USB copy/eject on a mounted ME1 volume;
- complete manual desktop/mobile editing behavior; and
- the public Vercel deployment.

## 10. Previous attempts and dead ends

- The repository began as a Vinext/Cloudflare full-stack starter. The active
  product moved to static Vite.
- `tests/rendered-html.test.mjs` targets a deleted loading skeleton, server
  output, and a removed dependency. It is excluded from `npm test`.
- Early notes reported a missing `vinext` command and broken dependencies.
  That is stale: the current Vite build, lint, and tests pass.
- D1 examples, ChatGPT auth, image optimization, Worker code, and Sites
  bindings are unused remnants. Do not revive them for ordinary editor work.

## 11. Known issues and risks

- Binary compatibility is reverse engineered and safety sensitive. A plausible
  UI result does not prove hardware validity.
- Tests inspect source patterns and build output but do not execute format code
  against fixtures.
- Unsaved configuration-slot edits can be omitted from configuration export.
- Draft export has no matching import.
- Friendly source names live only in React state unless explicitly saved.
- There is no autosave, undo history, or confirmation before starting a new
  file or discarding a slot edit.
- Inactive scaffold can mislead tools toward Next.js, Cloudflare, or databases.
- Firmware compatibility and earlier physical validation details are unknown.

## 12. Open questions

- Which ME-1 hardware and firmware versions accepted files from this writer?
- Have brand-new 72 KB configurations loaded successfully on hardware?
- Is Preset 1/current-mix behavior confirmed across supported firmware?
- Is draft import wanted, or is draft export intentionally archival?
- Should export be blocked or prompt when a slot has unsaved edits?
- What is the current Vercel project URL and deployment status?
- Can inactive starter files be deleted after a focused cleanup review?

## 13. Prioritized next steps

1. Add fixture-based executable tests for `parseME1`, `writeME1`,
   `parseConfiguration`, and `writeConfiguration`. Cover both sizes, no-op
   byte equality, output size, every assignment type, calibrated levels, names,
   groups, and unknown-byte preservation.
2. Run controlled hardware validation using copies of fixtures. Record device,
   firmware, procedure, outcomes, and hashes of exported artifacts.
3. Prevent accidental loss of unsaved slot edits during export/navigation.
4. Add draft import if resumable editing is required.
5. Record a desktop and phone-width manual UI pass across all relevant flows.
6. Verify Vercel settings and the public deployment.
7. Consider removing inactive scaffold in a separate verified change.

## 14. Handoff notes

- Read `docs/me1-format.md` before binary changes and treat fixtures as
  evidence.
- Run `git status` first and preserve unrelated changes.
- After code changes run `npm run lint`, `npm run build`, and `npm test`.
- Add fixture tests with any binary change; the smoke suite is insufficient.
- Do not claim hardware compatibility without a recorded physical-device test.
- Information unavailable from repository files or Git history is listed as an
  open question rather than presented as fact.
