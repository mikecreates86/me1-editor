# Making changes

This project uses the standard GitHub pull request workflow. `main` is always
the version that is (or can be) live, so changes never go straight onto it.

## The workflow

1. **Branch.** Start a branch from the latest `main` for one focused change:

   ```bash
   git switch main
   git pull
   git switch -c my-change-name
   ```

2. **Change and check.** Edit, then run the same checks CI runs:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

   For UI changes, also try them in `npm run dev`. For changes to how `.ME1`
   files are read or written, add a test to `tests/me1-format.test.mjs` and,
   before relying on the output, load an exported file on a real ME-1.

3. **Commit and push.**

   ```bash
   git add -A
   git commit -m "Short description of what changed and why"
   git push -u origin my-change-name
   ```

4. **Open a pull request** on GitHub from your branch into `main`. Fill in the
   checklist in the description.

5. **Wait for CI.** GitHub Actions runs lint, typecheck, build, and tests. A
   green check means they passed; a red X means something needs fixing. Push
   more commits to the same branch to fix it.

6. **Merge.** When CI is green and you are happy with the change, click
   **Merge pull request** (then **Delete branch**). Merging to `main` is what
   publishes the change to the live site if Vercel is connected.

If a merged change turns out to be wrong, open the merged pull request on
GitHub and click **Revert** to create a pull request that undoes it.

## Dependency updates

Dependabot opens pull requests each month to update npm packages and GitHub
Actions. Treat them like any other pull request: merge them when CI is green,
and try the app in `npm run dev` for major-version updates.

## Rules that protect ME-1 files

- Do not edit anything under `Configs/` or the embedded bytes in
  `app/me1-template.ts`; they are reference data from real hardware.
- Preset files are exactly 4,096 bytes and configurations 73,728 bytes.
- Bytes the editor does not understand must be preserved on export.

See [`AGENTS.md`](AGENTS.md) and [`docs/me1-format.md`](docs/me1-format.md)
for the full rules.
