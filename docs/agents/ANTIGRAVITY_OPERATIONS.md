# Antigravity Operations

Practical, step-by-step guide to running Engineering Atlas work inside
Google Antigravity. Pair this with [AGENT_ORCHESTRATION.md](AGENT_ORCHESTRATION.md)
for how delegation flows and [MCP_INTEGRATION.md](MCP_INTEGRATION.md) for
how external tools are wired in.

---

## 1. Opening the repository

1. Clone the repo and open its root folder in Antigravity. The root is the
   folder containing `package.json`, `AGENTS.md`, `CLAUDE.md`, and
   `.agents/`.
2. Antigravity scans one level deep inside `.agents/rules/`,
   `.agents/skills/`, and `.agents/agents/`. The workspace / each parent
   directory up to the repo root is checked, so running Antigravity from
   a subfolder still picks everything up.
3. On the first session, Antigravity caches skill descriptions and MCP
   tool schemas under `~/.gemini/antigravity/`. Subsequent sessions start
   faster.

Rules load automatically:

- `project-core.md` and `testing-and-git.md` are `always_on` — in context
  every turn.
- `content-authoring.md`, `visualization.md`, and
  `simulation-engineering.md` are `glob`-triggered — they activate when
  matching files are touched.

No action needed.

---

## 2. Invoking skills

Five project skills are available (one more than Phase 2):

| Skill | When to use |
|---|---|
| `implement-learning-domain` | Adding or extending a concept, category, or domain. |
| `implement-interactive-lab` | Adding a simulation, hands-on, or challenge lab to a concept. |
| `review-educational-content` | Reviewing lessons, provider details, scenes, or knowledge checks. |
| `validate-and-prepare-commit` | Running targeted lint/typecheck/tests/build before a commit proposal. |
| `write-architecture-decision` | Drafting an ADR for a material architectural change. |

How to invoke:

- **App:** ask in plain language — the main agent picks the matching
  skill. You can also open the skill picker and run it explicitly.
- **CLI:** each skill is exposed as a slash command:
  `/implement-learning-domain`, `/implement-interactive-lab`,
  `/review-educational-content`, `/validate-and-prepare-commit`,
  `/write-architecture-decision`.
- After editing a skill file, run `/skills reload` so the new metadata
  and body are picked up.

Skills are safe to invoke even when they don't fully fit — each has a
"Stop and ask" section that tells the agent when to pause.

---

## 3. Delegating to custom agents

Four custom agents live under `.agents/agents/`. The main agent delegates
to them via `invoke_subagent`; you can also pick one explicitly through
`/agents`.

| Agent | Policy | What to ask for |
|---|---|---|
| `educational-content-reviewer` | read-only | "Review the Kubernetes storage concepts for technical accuracy and depth." |
| `architecture-reviewer` | read-only | "Review this diff against ADR-007 and ADR-008." |
| `simulation-engineer` | read-only | "Audit the new storage simulation for determinism and step-back correctness." |
| `qa-reviewer` | auto (commands) | "Run the targeted validation for this change — content + lint + typecheck + build." |

All four return structured findings (file, severity, suggestion). The
main agent integrates them into a single user-facing summary. Only
`qa-reviewer` can run shell commands; the three review agents are
strictly read-only.

See [AGENT_ORCHESTRATION.md](AGENT_ORCHESTRATION.md) for the canonical
delegation flow (which reviewers run in parallel, when to skip one, how
conflicts are resolved).

---

## 4. Using GitHub MCP

Set up once per machine — see [MCP_INTEGRATION.md](MCP_INTEGRATION.md)
for scopes, Docker install, and the PAT placement. Then, inside
Antigravity:

- Ask the agent to inspect the repository, a PR, an issue, or a workflow
  run. Example prompts:
  - "Get the details of PR #12 and the review comments."
  - "Show the last three workflow runs and whether they passed."
  - "Fetch the file `docs/decisions/ADR-008-svg-first-visualization.md`
    from `main`."
  - "List open issues mentioning 'storage'."
- The first time a tool runs, Antigravity prompts for approval. Approve
  per-call or grant a policy if the tool is one you'll use repeatedly.

**Hard limits enforced here:**

- The server is launched with `--read-only` and an `enabledTools`
  allow-list in `.agents/mcp_config.json`. Mutation tools are not
  exposed.
- Do not grant write scopes to the PAT even if a workflow would benefit
  — mutations (open PR, merge, push, approve review, close issue) require
  an explicit, bespoke change and your approval each time.

---

## 5. Using Playwright MCP

Set up once per machine — see [MCP_INTEGRATION.md](MCP_INTEGRATION.md).
Then, inside Antigravity:

1. Start the dev server in a separate terminal:
   ```sh
   npm run dev
   ```
   The dev server runs at `http://localhost:5173/` by default.
2. Ask the agent to open it and inspect the UI. Example prompts:
   - "Open `http://localhost:5173/cloud-fundamentals/compute/virtual-machines`
     and take an accessibility snapshot of the lesson workspace."
   - "Screenshot the Kubernetes storage lab in both light and dark
     theme at 1440×900 and 390×844."
   - "Navigate the five intro lessons of the Cloud Fundamentals domain
     and report any console errors."
3. Use the snapshots / screenshots as evidence in review summaries. The
   Content Reviewer can ground findings in them ("the sequence scene on
   state 3 renders the `allow` edge in error red at 390 px — screenshot
   attached").

**Safety:**

- Playwright is scoped to `localhost:5173` and explicitly approved URLs
  during a review. Do not point it at third-party sites.
- `--isolated` keeps the automated browser profile separate from your
  real one. Do not drop it.
- Do not type real credentials, PATs, or PII into forms via Playwright
  — the browser session is logged.

---

## 6. Recommended workflow for a new learning-domain slice

This is the full flow, matching
[AGENT_ORCHESTRATION.md](AGENT_ORCHESTRATION.md):

1. **Prepare.** Say what slice you want: concept names, category, scope,
   providers. Attach any outline you have.
2. **Invoke** `/implement-learning-domain`.
3. **Confirm the outline.** The skill will propose Domain → Category →
   Concept → Lesson/Lab shape before authoring. Correct it if needed.
4. **Author.** The skill authors metadata, lesson bodies, scenes,
   knowledge checks, and (if in scope) labs. For labs it invokes
   `/implement-interactive-lab`.
5. **Review in parallel.** The main agent delegates in one turn to
   `educational-content-reviewer`, `architecture-reviewer`, and (if labs
   were added) `simulation-engineer`. All three return findings.
6. **Apply findings.** The main agent synthesises the three reports,
   applies the fixes, flags genuine conflicts for your decision.
7. **(Optional) UI inspection.** With the dev server running, inspect the new
   concept pages and snapshot key lessons / labs using Playwright MCP (if
   configured) or Antigravity's built-in `browser` subagent at
   `http://localhost:5173`. Catch rendering issues that tests don't.
8. **Validate.** The main agent invokes `/validate-and-prepare-commit`,
   which delegates to `qa-reviewer` for targeted vitest, lint, typecheck,
   and build.
9. **Approve the commit.** The main agent proposes a conventional-commit
   message. You approve or redirect. No automatic commits, no automatic
   pushes, no automatic PRs.

---

## 7. Validating and reviewing work

Lightweight validation only — do not run the full test suite for
ordinary tasks.

- `npm test -- src/content/<domain>` for a content slice.
- `npm test -- src/engines/<engine>` for an engine change.
- `npm run lint`.
- `npm run typecheck`.
- `npm run build` — **mandatory** before committing feature work. Runs
  `tsc -b && vite build`.

`qa-reviewer` automates this sequence, distinguishes pre-existing
failures from regressions with evidence, and never claims a step passed
unless it actually ran.

On Windows PowerShell, if execution policy blocks `npm.ps1` / `npx.ps1`
(`PSSecurityException`), invoke npm through `cmd /c npm ...` (for example
`cmd /c npm run lint`, `cmd /c npm test -- src/content/cloud-fundamentals`).
Do not change the user's PowerShell execution policy.

For UI/visual review, Playwright MCP (optional) or Antigravity's built-in
`browser` subagent against `npm run dev` (`http://localhost:5173`) provides
evidence that automated tests don't: real rendering, real console errors,
real responsive behaviour. Use it when the change affects what learners see.

---

## 8. Git operations

- **No commits, pushes, PRs, or merges happen automatically.** All of
  them require explicit user approval.
- Conventional commits: `feat(scope): …`, `fix(scope): …`,
  `docs(scope): …`, `refactor(scope): …`, `test(scope): …`,
  `chore(scope): …`.
- Branch naming: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`.
- `main` is protected — never commit directly without an explicit ask.
- `--no-verify`, `--force`, history rewrites, and destructive resets are
  all off-limits without a per-case ask.

---

## 9. When something doesn't work

- **A rule doesn't seem to apply:** check its frontmatter. `trigger`
  values are `always_on`, `glob`, `model_decision`, `manual` (snake_case).
  Glob rules need a `globs:` list; a missing `globs:` on a `glob` rule
  silently drops it.
- **A skill doesn't show up in the picker:** confirm the folder is
  `.agents/skills/<name>/SKILL.md` (uppercase SKILL.md). Then
  `/skills reload`.
- **A custom agent doesn't show up:** confirm `.agents/agents/<name>.md`
  (or `.agents/agents/<name>/agent.md`), `subagent: true` in frontmatter,
  and a non-empty `description`.
- **MCP tool fails or hangs:** see [MCP_INTEGRATION.md](MCP_INTEGRATION.md)
  §Troubleshooting for each server.
- **Validation reports pre-existing failures:** that's by design —
  `qa-reviewer` surfaces them rather than hiding them. Triage separately.
- **Windows PowerShell blocks `npm` or `npx` (`PSSecurityException` on `.ps1`):**
  run via `cmd /c npm ...` (e.g. `cmd /c npm run typecheck`) or `node ./node_modules/...`.
  Do not modify the user's PowerShell execution policy.
