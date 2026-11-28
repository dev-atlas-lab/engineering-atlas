# Agent Git Contribution Workflow

This document is the **canonical, tool-agnostic Git contribution standard**
for this repository. Every AI coding agent (including Google Antigravity,
Claude Code, OpenAI Codex, and other automated or interactive coding agents)
must follow this workflow regardless of platform or runtime.

Companion templates:

- Commit template: [.gitmessage](../../.gitmessage)
- Pull request template: [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)

Repository-specific constraints (such as branch protections, validation commands,
and important-file lists) live in the repository's instruction files (such as
[AGENTS.md](../../AGENTS.md) and [CLAUDE.md](../../CLAUDE.md)) and apply
alongside this workflow.

---

## Standard 8-Step Workflow

### Step 1 — Understand

- Read repository instructions and architectural documentation before editing.
- Inspect the relevant modules, existing patterns, and tests.
- Confirm the task scope and acceptance criteria.
- Identify which files are **in scope** and which are **out of scope** (including
  any pre-existing local or untracked work).

### Step 2 — Branch

- Inspect the current branch and working tree (`git status`, `git branch`,
  `git log --oneline`).
- Fetch remote references when appropriate (`git fetch`) so base assumptions are
  current.
- Verify the intended base branch (or explicitly requested stacked branch)
  before creating a branch.
- Create a task-specific branch using a descriptive name:
  - `feat/<description>`
  - `fix/<description>`
  - `refactor/<description>`
  - `docs/<description>`
  - `test/<description>`
  - `chore/<description>`
- Never create a branch from an unverified or unintended base.
- Never overwrite, discard, or mix in existing unrelated work.

### Step 3 — Implement

- Follow the repository's existing architecture, style, and conventions.
- Keep all edits strictly within task scope.
- Do not mix unrelated refactors, tooling changes, or adjacent tasks into the
  same branch or commit.
- Do not silently modify or delete user-owned or in-progress changes.

### Step 4 — Validate

- Run relevant unit tests for the files and modules affected.
- Run lint and type checks when applicable to the files changed.
- Run the production build when applicable (for example, application code,
  content registration, or build configuration changes).
- Report any skipped checks and the exact reason they were skipped (for example,
  documentation-only change or environment restriction).
- **Never claim a check passed if it was not executed.**
- Inspect the final diff (`git diff` / `git diff --cached`) before committing.

### Step 5 — Commit

Before creating a commit:

1. Inspect `git status`.
2. Inspect the complete staged diff (`git diff --cached`).
3. Verify no unrelated or unintended files are staged.
4. Verify no secrets, tokens, keys, or private credentials are included.
5. Verify any generated artifacts included in the commit are intentional.
6. Verify test and validation results match what will be reported.

Commit rules:

- Follow the Conventional Commits format defined in [.gitmessage](../../.gitmessage):
  `<type>(<scope>): <short description>`
  (supported types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`,
  `ci`, `chore`, `revert`).
- Keep the subject concise and imperative; never put agent or model
  attribution in the subject line.
- Every agent-generated commit must include the attribution trailers:
  - `Agent: <agent name>`
  - `Model: <exact model name>` (use `Unknown` if the runtime does not expose
    the model — never guess)
- Include `Supporting-Agents: <agent names>` when multiple agents contributed and
  their identities are known.
- Include `Issue: #<number>` only for real, verified issue numbers — never
  fabricate issue numbers.
- Do not add a fake `Co-Authored-By` identity.
- Use explicit file staging (`git add <path>...`). **Never** use `git add -A`
  or `git add .` when unrelated or untracked work may exist in the working
  tree.
- Never amend existing commits unless explicitly requested by the user.

### Step 6 — Push

- Push only the task branch.
- Never force push (`--force` or `--force-with-lease`) without explicit user
  approval.
- Never push directly to protected branches (such as `main`).
- Do not push if validation or scope checks fail.
- Do not push unless the task or user explicitly authorizes pushing.

### Step 7 — Pull Request

- Use [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md).
- Ensure the PR description reflects actual implementation and validation
  results, covering:
  - What changed
  - Why it changed
  - Important technical decisions (when applicable)
  - Validation results (and any skipped checks with reasons)
  - Known limitations, risks, or follow-up work (when applicable)
  - Agent and model attribution (`Primary Agent`, `Model`, `Supporting Agents`,
    `Human Reviewer`)
- Never claim tests or builds passed if they were skipped.
- Do not create or merge a pull request unless explicitly authorized by the task
  or user.

### Step 8 — Completion Report

Every agent completion report must state:

- Branch name
- Base branch
- Commit hash and subject (or staged/uncommitted status if committing was not
  authorized)
- Files changed
- Validation results
- Push status
- PR URL (if created)
- Agent name
- Exact model name (or `Unknown` if not exposed by the runtime)

Clearly distinguish **completed**, **skipped**, and **blocked** work.

---

## Git Safety Policy

The following operations require **explicit user approval** before execution:

- `git reset --hard`
- `git clean` (such as `git clean -f` or `git clean -fd`)
- Force push (`git push --force`, `git push --force-with-lease`)
- Rewriting shared Git history (`git rebase`, `git commit --amend` on shared
  commits, filter-branch)
- Deleting remote branches
- Deleting important project files
- Overwriting unrelated user changes
- Committing secrets or credentials (for example `.env*`, tokens, private keys,
  local secret configs)
- Merging into protected branches

> **Authority boundary:** Repository instructions define expected engineering
> behaviour, not authorization bypasses. They do **not** substitute for actual
> platform-level permissions, branch protection rules, credential policies, or
> explicit user approval.
