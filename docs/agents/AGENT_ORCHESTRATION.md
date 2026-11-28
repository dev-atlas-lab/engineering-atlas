# Agent Orchestration

How the main Antigravity agent should delegate work to Engineering Atlas's
specialised custom agents and skills. This document is the authoritative
delegation contract; the always-on rule `project-core.md` and the five
skills under `.agents/skills/` encode the mechanics.

---

## Roles

| Role | Where it lives | Writes code? | Runs commands? |
|---|---|---|---|
| **Main agent** | The Antigravity session you interact with | Yes | Yes |
| `implement-learning-domain` skill | `.agents/skills/implement-learning-domain/` | Main agent executes | Yes (via `qa-reviewer`) |
| `implement-interactive-lab` skill | `.agents/skills/implement-interactive-lab/` | Main agent executes | Yes (via `qa-reviewer`) |
| `review-educational-content` skill | `.agents/skills/review-educational-content/` | No (review only) | No |
| `validate-and-prepare-commit` skill | `.agents/skills/validate-and-prepare-commit/` | No | Yes |
| `write-architecture-decision` skill | `.agents/skills/write-architecture-decision/` | Drafts a `docs/decisions/` file | No |
| `educational-content-reviewer` agent | `.agents/agents/educational-content-reviewer.md` | No (read-only) | No |
| `architecture-reviewer` agent | `.agents/agents/architecture-reviewer.md` | No (read-only) | No |
| `simulation-engineer` agent | `.agents/agents/simulation-engineer.md` | No (read-only) | No |
| `qa-reviewer` agent | `.agents/agents/qa-reviewer.md` | No (read-only) | Yes (`auto` policy) |

The main agent owns the task, synthesises review findings, and is the only
one that talks to the user.

---

## Canonical flow — implementing a learning-domain slice

```
   User request
        │
        ▼
   Main agent
        │  reads AGENTS.md, CLAUDE.md, docs/agents/ARCHITECTURE_OVERVIEW.md
        │  invokes /implement-learning-domain
        ▼
   implement-learning-domain skill
        │  outlines metadata (confirm with user if structural)
        │  authors metadata (meta.ts, index.ts, loader entry)
        │  authors lesson bodies, scenes, knowledge checks
        │  (for each lab) invokes /implement-interactive-lab
        │        │
        │        ▼
        │   implement-interactive-lab skill
        │        pure simulation definition + tests + lab view + binding
        ▼
   Main agent delegates review in parallel:
        │
        ├──▶ simulation-engineer   (only if labs were added or changed)
        │       determinism, state-model clarity, separation, failure paths
        │
        ├──▶ architecture-reviewer
        │       ADR compliance, abstraction level, content-registration drift
        │
        └──▶ educational-content-reviewer
                technical accuracy, depth, progression, diagram correctness
        │
        │  (all three return findings — never edits)
        ▼
   Main agent synthesises findings
        │  applies fixes the reviewers agreed on
        │  surfaces genuine conflicts to the user
        ▼
   Main agent invokes /validate-and-prepare-commit
        │
        └──▶ qa-reviewer
                targeted vitest, lint, typecheck, build
                distinguishes pre-existing from regression
        ▼
   Main agent reports to user
        │  files changed, findings applied, validation results
        │  commit proposal with conventional-commit message
        ▼
   User approves commit
        ▼
   Main agent commits (never merges, never pushes without explicit ask)
```

---

## Delegation rules

1. **The main agent owns the task.** Reviewers do not own the task and do
   not communicate with the user directly. They report; the main agent
   decides.

2. **Reviewers do not edit implementation files.** Only the main agent
   edits. A reviewer that wants a change files a finding with a concrete
   suggestion; the main agent applies it (or not, with reason).

3. **Review findings must include** a file path, a line or symbol or
   content-id anchor, a one-sentence issue, a severity
   (`blocking` / `should-fix` / `nit`), and a concrete suggestion or a
   question for the author.

4. **The main agent resolves conflicts.** When the architecture-reviewer
   and the content-reviewer disagree (e.g. one says "extract a helper",
   the other says "keep the duplication for clarity"), the main agent
   decides and records the reason in the user-facing summary.

5. **QA distinguishes introduced from pre-existing failures** with
   evidence: either the failing file is in the diff, or a stash-run on
   the baseline reproduces the failure. Pre-existing failures are
   reported but never silently fixed, and never silently masked.

6. **The user remains the final decision-maker** on commits, pushes,
   PRs, merges, status promotions, dependency changes, and anything the
   main agent flagged as needing approval.

---

## Parallelism

- Content, architecture, and simulation reviews are independent. Run them
  in **parallel** by issuing all three `invoke_subagent` calls in a single
  turn. Each returns to the main agent before synthesis.
- QA is **sequential** — it runs the actual lint / typecheck / build and
  is the last step before the commit proposal, so findings from the three
  reviewers can be applied first and re-checked by QA.

---

## When to skip a reviewer

- **Simulation engineer** — skip for changes that don't touch
  `src/engines/simulation/**`, `src/engines/lab/**`, or any
  `*-simulations.ts` / `*-simulation-views.tsx`. Keep for any lab change.
- **Architecture reviewer** — never skip for changes that touch content
  registration (`meta.ts`, `index.ts`, `concept-loaders.ts`), engine
  types, or new abstractions. Safe to skip for pure lesson-body edits.
- **Content reviewer** — skip for pure engine or infrastructure changes
  that don't touch `src/content/**`. Keep for every content touch.
- **QA reviewer** — never skip. Even documentation changes get a lint
  pass at minimum.

---

## Review flow for an ADR draft

An ADR draft from `write-architecture-decision` does **not** run through
the three code reviewers. It runs:

```
write-architecture-decision skill → Main agent reads it → user approves →
main agent flips Status: Proposed → Accepted (only on explicit approval)
```

The architecture-reviewer may be invoked **before** writing the ADR to
identify constraints the ADR must respect, but not as a review of the
ADR draft itself (that is the user's call).

---

## Custom-agent constraints (restated so delegation is honest)

- All four custom agents set `mainAgent: false, subagent: true`. They are
  only reachable via `invoke_subagent` from the main agent.
- Three reviewers (`educational-content-reviewer`, `architecture-reviewer`,
  `simulation-engineer`) run with `commandExecutionPolicy: off`. They
  cannot run tests, lint, or any shell command.
- Only `qa-reviewer` has `commandExecutionPolicy: auto`. It can run the
  documented validation commands non-interactively; destructive operations
  still prompt.
- None of the custom agents can modify files.
- Reviewers report uncertainty (e.g. "could not verify current EBS limit")
  rather than inventing certainty. The main agent treats such findings as
  follow-up research tasks, not as verified bugs.
