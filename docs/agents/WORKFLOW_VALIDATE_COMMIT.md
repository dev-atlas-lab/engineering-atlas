# Workflow — Validate and Prepare a Commit

Use this after implementing a feature or content change, before suggesting
a commit.

Do **not** run the entire test suite for ordinary feature tasks. Run the
tests that are actually relevant.

---

## Steps

### 1. Inspect git status

```
git status
git diff --stat
```

Confirm:

- You are on a feature branch (not `main`).
- Only the files you intended to change are modified.
- No stray build artefacts (`dist/`, `.tsbuildinfo`, `node_modules/`).
- No files that look like they could contain secrets.

If there are unexpected changes, stop and ask.

### 2. Review changed files

- `git diff <path>` on each changed file.
- Confirm no backwards-compatibility hacks, no dead code, no debug prints,
  no commented-out blocks.
- Confirm new code matches surrounding conventions (naming, exports,
  imports).

### 3. Run relevant unit tests only

Pick the smallest useful slice:

- `npm test -- src/content/<domain>` for a content slice.
- `npm test -- src/engines/<engine>` for an engine change.
- `npm test -- src/pages/<page>` for a page change.
- `npm test -- <specific-file>` for a one-file change.

If this is the first run of this session, also run
`npm test -- src/content` once to confirm the eager index invariants still
hold — this is cheap and catches id collisions early.

### 4. Lint

```
npm run lint
```

Fix warnings you introduced. Do not fix pre-existing warnings in unrelated
files unless the task asks for it.

### 5. Typecheck

```
npm run typecheck
```

No `any` on new public surfaces. Narrow types explicitly at module
boundaries.

### 6. Production build

```
npm run build
```

This runs `tsc -b` then `vite build`. A successful build is **mandatory**
before committing feature work. The build also catches type regressions the
focused `typecheck` could miss, because it re-checks the whole project.

> **Windows PowerShell note:** If execution policy blocks `npm.ps1`, use
> `cmd /c npm ...` (e.g. `cmd /c npm run build`). Do not modify the user's
> PowerShell execution policy.

### 7. Inspect the diff one more time

```
git diff --staged
```

Look for anything that shouldn't be committed. Confirm commit scope matches
the task scope.

### 8. Commit

Only commit when the user has explicitly asked you to commit. If so:

- Use a conventional commit message: `feat(scope): …`, `fix(scope): …`,
  `docs(scope): …`, `refactor(scope): …`, `test(scope): …`, `chore(scope): …`.
- One logical change per commit. If the diff covers two unrelated changes,
  stage them separately.
- Do not commit lockfile changes you did not intend.
- Do not commit files likely to contain secrets (`.env`, `.env.*`,
  `credentials*`, `*.pem`, `*.key`, personal tokens).

### 9. Never force-push

`git push --force`, `git push --force-with-lease`, history rewrites, and
destructive branch resets require explicit user approval each time. Do not
force-push to `main` under any circumstance.

### 10. Never merge or create a pull request unless asked

If the user asks for a pull request, use `gh pr create` with a clear title
and a body that lists the summary and a self-check for testing. Do not
merge the pull request; that is the user's call.

---

## Honesty rules

- Never claim a test passed unless it actually ran in this session.
- Never claim the build succeeded unless it actually ran.
- Report pre-existing baseline failures explicitly in the summary; do not
  modify them to hide them.
- Report skipped validation steps.
