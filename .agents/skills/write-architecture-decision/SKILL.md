---
name: write-architecture-decision
description: Use when the user asks to draft or record an Architecture Decision Record (ADR) for Engineering Atlas, or when a change is material enough that an ADR is warranted (new dependency, change to the content model, change to an engine's public shape, abandonment of a prior decision). Produces an ADR draft in the repo's existing format with status "Proposed" — never declares a decision accepted without user approval.
---

# Write an Architecture Decision Record

Use this skill when the task is "write an ADR for X", "capture this
decision", or when a code change would reasonably need one. Do not use it
for tactical implementation choices that do not change the architecture.

## Before you start

Read every existing ADR under `docs/decisions/` (file names only is not
enough — open at least two to match tone and depth). They define the
repository's ADR format. Also read the sections of `docs/ARCHITECTURE.md`,
`docs/CONTENT_MODEL.md`, or `docs/LAB_ENGINE.md` that the proposed
decision touches.

## When an ADR is warranted

- Adding or removing a runtime dependency (ADR-005 rule).
- Changing the content model's public shape or metadata/body contract.
- Changing an engine's public interface (visualization, simulation, lab,
  assessment).
- Changing the state-management footprint (ADR-006).
- Changing the rendering strategy (SVG vs React Flow vs other — ADR-008).
- Introducing a backend, build-time content API, or any service runtime.
- Adopting or dropping a cross-cutting pattern (routing, persistence,
  testing).
- Superseding or materially revising an earlier ADR.

A one-off bug fix, a lesson edit, a new concept, or a UI tweak **does not**
need an ADR. Flag it explicitly if the user asks for one in that case.

## Procedure

1. **Number and title.** Find the highest existing ADR number in
   `docs/decisions/` and use the next one. Title is a short noun phrase
   (not a sentence) summarising the decision — match the style of existing
   titles (e.g. "Per-Concept Content Loading", "SVG-First Visualization").
2. **Status: Proposed.** Draft ADRs start as `Proposed`, never `Accepted`.
   Only the user (or the user's explicit approval during this task)
   promotes to `Accepted`. Earlier ADRs that are being replaced go to
   `Superseded by ADR-NNN`; mark them in the same change set, but do not
   edit them silently.
3. **Context.** Describe the state of the world and the specific pressure
   forcing a choice. Name the files or modules affected. If there is
   measurement data (bundle size, test count, load time) include it.
   Avoid rhetorical framing — the context should let the reader reconstruct
   the pressure without reading your mind.
4. **Alternatives considered.** At least two realistic alternatives
   besides the recommendation, each with a one-paragraph description of
   what it would look like and what it would cost. If "do nothing" is a
   real option, list it. Omit strawmen.
5. **Decision.** State the decision in one sentence, then enumerate what
   it means concretely: file paths, module boundaries, dependencies added
   or removed, test invariants added, UI contracts. Someone implementing
   from this ADR should not have to guess.
6. **Consequences.** Three subsections mirroring the existing ADR shape:
   - **Benefits** — what this decision enables.
   - **Trade-offs** — what it costs. Be honest; do not hedge.
   - **Mitigations** — how the trade-offs are managed.
7. **Migration and compatibility.** A short section for any decision that
   needs a transition: what changes atomically, what changes in steps,
   what lives temporarily as a shim, and what the test that guards the
   migration looks like. Omit this section if the change is additive and
   no migration exists.
8. **Future considerations.** Decisions explicitly deferred, questions
   left open, and the conditions under which the ADR might be revisited.
   Not a to-do list — only items the author would want a future reader to
   know.
9. **Output.** Write to `docs/decisions/ADR-NNN-<kebab-case-title>.md`.
   Save it as a draft — do not stage, commit, or push. Tell the user what
   you wrote, where, and that it is `Proposed`.

## Acceptance criteria

- The file name matches `ADR-NNN-<kebab-title>.md` with the next free
  number.
- `## Status` reads `Proposed` (or `Superseded by …` for an ADR being
  replaced in the same change).
- The five required sections exist: Context, Decision, Consequences,
  (Migration if applicable), Future Considerations.
- At least two credible alternatives are considered.
- The decision statement is one sentence, followed by concrete
  implementation detail.
- Nothing in the ADR claims a product-level decision as accepted that the
  user has not approved.

## Stop and ask

- The user asked for an ADR on a change that does not meet the "when an
  ADR is warranted" list. Confirm whether to draft it anyway or decline.
- The decision supersedes an existing ADR. Confirm the earlier ADR's
  status change is in scope.
- The decision has product-level consequences (changes what learners see,
  changes the roadmap). Draft the ADR as `Proposed` and surface the
  product question separately.
- Two alternatives look equally good and the trade-off genuinely needs the
  user's judgement call. Draft both as alternatives and recommend one,
  but flag the call for the user.

## Do not

- Write an ADR with `## Status: Accepted` without explicit user approval.
- Silently supersede an existing ADR by editing its status.
- Fabricate measurement data ("this will reduce bundle size by 30%") the
  change set does not demonstrate.
- Expand scope — one ADR per decision; related decisions get their own.
