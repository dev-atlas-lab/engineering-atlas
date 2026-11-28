---
trigger: always_on
description: Validation policy and Git safety rules for Engineering Atlas.
---

# Validation & Git — Safety Rules

## Validation policy

Do **not** run the entire test suite for ordinary feature tasks. Prefer:

- `npm test -- <path>` for the files directly affected and any related
  simulation / content module tests.
- `npm run lint`.
- `npm run typecheck`.
- `npm run build` — a successful production build is **mandatory** before
  committing feature work (it runs `tsc -b` then `vite build`, so it also
  catches type regressions in the whole project).

On Windows PowerShell, if execution policy blocks `npm.ps1` / `npx.ps1`,
run commands via `cmd /c npm ...` (for example `cmd /c npm run lint`,
`cmd /c npm test -- <path>`). Do not modify the user's PowerShell
execution policy.

Pre-existing baseline failures:

- Confirm they are pre-existing (stash the change, re-run).
- Do not modify unrelated tests to hide them.
- Report them honestly in the final summary.

Never claim a test, lint, typecheck, or build passed unless it actually ran
in this session.

## Git safety

- Never commit directly to `main` unless the user explicitly asks.
- Never force-push, never rewrite history, never skip hooks (`--no-verify`),
  never bypass signing. If a hook fails, fix the root cause.
- Never merge branches or create pull requests unless explicitly requested.
- Run `git status` before any command that could discard uncommitted work
  (`git checkout`, `git restore`, `git reset`, `git clean`, `rm -rf` in the
  repo). Stash (`-u` for untracked) or commit first.
- When staging: review `git status` after a broad `git add` and double-check
  any file whose contents might include secrets before pushing.
- Branch names: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`,
  `refactor/<scope>`, `chore/<scope>`.
- Conventional commit messages. One logical change per commit.

## Approval required before

- Deleting or renaming important files (`CLAUDE.md`, `AGENTS.md`,
  `package.json`, lockfile, tsconfig*, vite.config, eslint.config, ADRs,
  docs, every `meta.ts` and `index.ts` under `src/content/`, `types.ts`).
- Any destructive git operation.
- Removing or downgrading a dependency.
- Changing product behaviour not explicitly requested.
- Introducing a backend, build-time content API, or new dependency.
