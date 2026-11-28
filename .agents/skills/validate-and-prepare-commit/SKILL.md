---
name: validate-and-prepare-commit
description: Use after implementing a feature or content change and before suggesting a commit. Runs targeted validation (relevant vitest, lint, typecheck, build), checks git status, and reports what's ready. Never commits automatically.
---

# Validate and Prepare a Commit

Use this skill as the closing step on any implementation task. Do not run
the full test suite for ordinary features — only the relevant slice.

The always-on `testing-and-git.md` rule covers the policy; this skill is
the procedure.

## Procedure

1. **Git status.**
   ```sh
   git status
   git diff --stat
   ```
   Confirm: on a feature branch (not `main`); only intended files are
   modified; no build artefacts (`dist/`, `.tsbuildinfo`, `node_modules/`);
   no suspicious files that could contain secrets.

2. **Review each changed file.** `git diff <path>`. Look for: debug prints,
   commented-out blocks, backwards-compat shims nobody asked for, dead
   code, naming/export conventions matching the surrounding code.

3. **Run only the relevant tests.** Pick the smallest useful slice:
   - Content slice: `npm test -- src/content/<domain>`
   - Engine change: `npm test -- src/engines/<engine>`
   - Page change: `npm test -- src/pages/<page>`
   - One file: `npm test -- <path>`

   On first run of a session that touches content, also run
   `npm test -- src/content` once — it enforces id uniqueness and the
   metadata/body invariants cheaply.

4. **Lint.** `npm run lint`. Fix warnings you introduced; leave unrelated
   pre-existing issues alone and report them.

5. **Typecheck.** `npm run typecheck`. No `any` on new public surfaces.

6. **Production build.** `npm run build` — **mandatory** for feature work.
   Runs `tsc -b && vite build`. Catches type regressions the focused
   typecheck can miss.

   *(Windows PowerShell: if execution policy blocks `npm.ps1` / `npx.ps1`,
   prefix with `cmd /c`, e.g. `cmd /c npm run lint`. Do not change the
   user's PowerShell execution policy.)*

7. **Diff one more time.** `git diff` (or `git diff --staged` if staged).
   Confirm the scope matches the task.

8. **Report.** Summarise:
   - Files changed.
   - Which tests, lint, typecheck, build commands actually ran, and their
     results.
   - Any pre-existing baseline failures, with the evidence that they are
     pre-existing (not introduced by this change).
   - Any skipped validation step and why.

9. **Commit — only when the user explicitly asks.** Conventional message
   (`feat(scope): …`, `fix(scope): …`, `docs(scope): …`,
   `refactor(scope): …`, `test(scope): …`, `chore(scope): …`). One logical
   change per commit. Do not stage files you did not intend to include. Do
   not commit `.env*`, `credentials*`, `*.pem`, `*.key`, or similar.

10. **Pull requests and pushes — only on explicit request.** Never merge.
    Never force-push. Never rewrite history. Never skip hooks.

## Honesty rules

- Never claim a test passed unless it actually ran this session.
- Never claim a build succeeded unless it actually ran this session.
- Report pre-existing failures rather than hiding them. Do not modify
  unrelated tests to make them pass.
- If a step was skipped (time, permission, platform), say so.

## Stop and ask

- `git status` shows unexpected modifications or stray files you did not
  create.
- A build failure's root cause is outside the current task's scope.
- A test failure appears to be pre-existing but you cannot confirm it with
  a clean checkout.
- The user has asked for a push, merge, or force-push.
