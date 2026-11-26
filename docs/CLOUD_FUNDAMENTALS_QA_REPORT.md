# Cloud Fundamentals — Final QA & Hardening Report

Audit of the complete Cloud Fundamentals domain after Slices 1–2D merged (through PR #8). The objective was to confirm the domain is production-ready before the Kubernetes domain begins. This is a QA and hardening pass: **no new concepts, lessons, or features were added.**

- **Branch:** `feat/cloud-fundamentals-final-qa`
- **Base:** `main` @ `88e0122` (PR #8, Slice 2D, merged)
- **Date:** 2026-11-26
- **Verdict:** Production-ready. No functional defects found. One pre-existing test-infrastructure issue (vitest runner) is documented below; it does not affect the shipped application, which builds and lints clean.

---

## 1. Summary of findings

| Area | Result |
|---|---|
| Curriculum integrity | Pass — 34 concepts, unique ids/slugs, correct statuses, no broken references |
| Learning experience | Pass — consistent concept→provider→comparison structure; knowledge checks correct |
| Visualizations & labs | Pass — accessible SVG, keyboard support, reduced-motion, deterministic simulations |
| Architecture & performance | Pass — per-concept lazy loading, React Flow isolated and unused on the shipped path |
| Provider accuracy | Pass (sampled) — claims accurate and appropriately hedged; false equivalences avoided |
| Build / Lint / Diff | Pass — `tsc -b && vite build`, `eslint src`, `git diff --check` all clean |
| Test runner (vitest) | **Known issue** — broken at the pinned vitest/vite version level; cause understood, fix out of QA scope |

**Defects fixed in this pass:** documentation accuracy only (see §9). No code defects were discovered, so none were manufactured — per the brief's instruction to prioritize real defects over cosmetic change.

---

## 2. Curriculum integrity

Verified against the real loaded content graph (see §7 for how this was executed without vitest):

- **10 categories, 34 concepts**, ids unique across the whole domain and unchanged from the committed `EXPECTED_CONCEPT_IDS`.
- **Statuses correct:** 30 Active, 4 Coming soon (`what-is-cloud-computing`, `cloud-service-models`, `cloud-deployment-models`, `disaster-recovery`), 0 In development. Active status is granted only to concepts with authored lessons; every Coming-soon concept has no content loader, and every authored concept has exactly one loader (no orphans, no extras).
- **170 lessons, 29 labs.** Lesson and lab ids are unique across the domain (not just within a concept) and never collide with each other — required because progress is keyed by bare id.
- **No broken references:** every `prerequisites` and `relatedConcepts` id resolves to a real concept; every provider lesson names a registered provider (`azure`/`aws`) with matching `providerDetails`.
- **No broken routes:** route table is correctly ordered (`.../labs/:labId` before `.../:lessonId`); invalid domain/category/concept/lesson/lab ids resolve to `NotFound`; Coming-soon concepts render a status panel; an "available but empty" concept is defensively downgraded rather than crashing.
- **Navigation hierarchy** (Domain › Category › Concept › Lesson/Lab) and breadcrumbs resolve through the full route depth.
- **Approved descriptions preserved** — no concept description or id was changed.

## 3. Learning experience

- **Structure is consistent:** concept lessons → provider lessons (Azure, AWS) → comparison lesson. Three conceptual topics (`data-centers-and-edge-locations`, `geographic-redundancy-and-data-residency`, `security-fundamentals`) deliberately use a single provider-comparison lesson instead of two full provider lessons. This is intentional (ADR-002: provider implementations attach where a distinct per-provider service exists), now fully documented in the curriculum doc (previously only two of the three were listed — corrected in this pass).
- **Knowledge-check quality:** every question has a valid correct-answer count (exactly one for single-choice/scenario, at least one for multi-select), every option carries a non-empty explanation, and ids are unique within question and lesson. Sampled answers across categories (Compute, IAM, Networking, Scalability, Observability) are technically correct — e.g., the VM resource-allocation arithmetic, and the Azure Availability Sets vs. AWS cluster Placement Groups distinction (correctly *not* treated as equivalent).
- **Depth:** sampled lessons are substantive, not filler — real mechanisms, plausible distractors, and specific provider terminology.

## 4. Visualization & lab audit

- **SVG-first (ADR-008) upheld:** `SceneRenderer` renders inline SVG by default and only lazy-loads React Flow when a scene sets `interaction: 'graph'`. No current scene does, so React Flow never loads on the shipped path.
- **Semantic accessibility:** SVG scenes expose `role="group"`, `aria-labelledby`/`aria-describedby`, `<title>`, and `<desc>`; decorative elements and icons are `aria-hidden`.
- **Keyboard:** interactive nodes/actors are `role="button"`, `tabIndex={0}`, `aria-pressed`, with an `onKeyDown` handler that activates on Enter/Space (`preventDefault`) and a visible focus ring. Timeline controls are native `<button>`s with `aria-label`s plus a labeled scrubber.
- **Reduced motion:** the only animation (the flowing dashed edge, `.atlas-flow`) is disabled under `@media (prefers-reduced-motion: reduce)`. No autoplay or Motion-library animation exists to bypass it.
- **Determinism:** all five observability simulations (metrics timeline, alert evaluation, log investigation, trace waterfall, incident investigation) produce byte-identical histories across runs, and pass known-input/expected-output checks (21/21). Earlier slices' simulations are unchanged.
- **Simulated vs. real:** simulations are framed as educational models; provider `limitations` and comparison lessons state real behavior separately.

> Not independently verified this pass: pixel-level rendering at 320/768/1280 px and light/dark themes were reviewed in code (responsive SVG `viewBox`, token-based theming) but not visually diffed in a browser — see §10.

## 5. Architecture & performance

- **Per-concept lazy loading (ADR-007):** every concept emits its own chunk (12.7 KB–80.4 KB raw; e.g. `authorization-and-policies` 80.4 KB / 22.9 KB gz is the largest). The eager curriculum index imports only metadata.
- **Route-level code splitting:** all pages (`Home`/`Domain`/`Category`/`Concept`/`Lesson`/`Lab`) are `lazy`-loaded.
- **React Flow isolation:** `@xyflow/react` compiles to a standalone 247 KB lazy chunk that nothing currently imports at runtime — zero cost to the initial load. It is retained intentionally for future graph scenes.
- **Dependencies:** no unused runtime dependency found. `motion`, listed as a stack intent in CLAUDE.md, was never actually installed — nothing to remove. Runtime deps are lean (`react`, `react-dom`, `react-router`, `zustand`, `idb-keyval`, `@xyflow/react`, `lucide-react`, `clsx`/`tailwind-merge`/`cva`/`class-variance-authority`).
- **Build:** `tsc -b && vite build` succeeds in ~0.5–0.9 s; main app chunk 396 KB (122 KB gz). One build warning (`MODULE_LEVEL_DIRECTIVE` "use no memo") originates in `react-compiler-runtime` inside `node_modules` — upstream and benign, not our code.

## 6. Provider accuracy

Checked sampled falsifiable claims (the places invented limits would hide: `limitations`, `architecturalNotes`, `keyFeatures`) across every category against vendor documentation. All sampled claims were accurate and appropriately hedged. Examples confirmed correct:

- Azure VNet reserves **5 addresses per subnet**, smallest IPv4 subnet **/29** — correctly kept distinct from AWS (also 5 reserved, but smallest **/28**).
- Entra ID **Conditional Access requires P1**, **PIM requires P2 / Entra ID Governance**.
- **Up to 20 federated identity credentials** per app / user-assigned managed identity.
- EBS **Multi-Attach on io1/io2** only; volume types `gp3, gp2, io1, io2, st1, sc1`.
- Azure Managed Disk tiers (Standard HDD, Standard SSD, Premium SSD, Premium SSD v2, Ultra).
- AWS Nitro described as a **KVM-based** Type 1 hypervisor with offload cards; Azure hypervisor **derived from Hyper-V**.
- Azure Monitor alert **severities 0–4**.

Content explicitly rejects false equivalences (e.g. "CloudFront is a CDN, not a general equivalent of Global Accelerator"; ALB/NLB regional vs. Route 53/Global Accelerator global). SLA/SLO percentages in the Observability content are pedagogical examples, not provider SLA claims.

> Scope note: this was a representative sample, not an exhaustive re-verification of all 170 lessons. No inaccuracy was found in the sample.

## 7. Testing — results and limitations

**What was executed (and passed):**

- `tsc -b && vite build` — type-checks the entire project (content and tests) and builds. **Pass** (exit 0), re-confirmed after a clean `npm ci`.
- `eslint src` — **Pass** (exit 0).
- `git diff --check` — **Pass** (clean).
- **Content integrity & schema — 26/26 invariant checks pass.** These are the data-level invariants from `src/content/cloud-fundamentals/index.test.ts`, run against the real, fully-loaded content graph (unique ids, status map, loader coverage, reference resolution, section/block presence, knowledge-check correctness, visualization node/edge/state integrity, lab-shape and challenge-solution validity, plus added heuristics: comparison-table column counts, non-empty code blocks, `https` doc/reading URLs, provider/comparison coverage, id uniqueness).
- **Simulation determinism & known-I/O — 21/21 checks pass**, run against the real compiled simulation modules.

**What could NOT be executed — the vitest runner is broken:**

Every test file fails during collection with `TypeError: Cannot read properties of undefined (reading 'config')` at the first `describe()`, including pre-existing committed tests and a zero-import smoke test.

- **Root cause (understood):** at collection, vitest sets its module-level collector `runner`, then evaluates the test file through Vite 8.3.8's module runner. The `describe` the test imports resolves to a *second* instance of vitest's internals inside that module graph, where `runner` is `undefined` — vitest's own internals are not being shared with the test-module graph. It is independent of our code (reproduces with zero imports) and independent of environment/pool (jsdom/node, forks/threads all fail identically).
- **Not a corrupted install:** a clean `npm ci` from the committed lockfile reproduces the exact `node_modules/@vitest` state and the exact failure. vitest 5.1.1 bundles its runner internally, and vite `^8.0.0` is within its declared peer range — so this is the deterministic behavior of the *pinned* pairing, not a broken download.
- **Why it was not "fixed" here:** the only fix is changing the pinned test-toolchain versions (a vitest point release or a different vite), which cannot be verified green in this environment and is outside a QA-hardening pass's safe scope — changing the lockfile-pinned toolchain without a verified-passing outcome would be reckless. The application itself is unaffected.
- **Interim verification:** the harness described above (Node 26 native type-stripping + a custom loader that stubs the JSX view modules) ran the real `index.test.ts` invariants and simulation determinism. It is a QA aid, **not** a committed substitute for vitest.

**Honest statement:** the vitest test suite was **not** executed and is **not** claimed to pass. The committed `*.test.ts` files remain the real deliverable and will run once the toolchain pin is repaired (see §10).

## 8. Build & lint results

| Gate | Command | Result |
|---|---|---|
| Production build | `tsc -b && vite build` | Pass (exit 0) |
| Lint | `eslint src` | Pass (exit 0) |
| Whitespace/conflict | `git diff --check` | Pass (clean) |

## 9. Defects discovered and fixed

- **Documentation accuracy (fixed):** the curriculum doc's "Remaining gaps" listed only two of the three comparison-only concepts; `geographic-redundancy-and-data-residency` was missing. Corrected, with the rationale tied to ADR-002.
- **Roadmap staleness (fixed):** Slice 2D was still marked "In review" though PR #8 is merged; updated to "Merged" and a Final QA row added.

No code defects were found.

## 10. Remaining known issues / follow-ups

1. **Repair the vitest toolchain (highest value).** Resolve the vitest 5.1.1 / vite 8.3.8 collection failure (try a vitest patch bump or an alternative vite within the peer range), verify a focused test runs green, then the committed test suite — including `index.test.ts` and `simulations.test.ts` — becomes executable in CI. Owner: tooling. This is the one thing standing between the repo and a fully-running automated suite.
2. **Visual/responsive verification.** Pixel-level checks at 320/768/1280 px and light/dark themes were reviewed in code but not browser-diffed. A short manual or screenshot pass (or a visual-regression harness, once the runner is fixed) would close this.
3. **Provider accuracy is sampled, not exhaustive.** A future content pass could systematically re-verify every numeric claim across all 170 lessons against current vendor docs.
4. **`what-is-cloud-computing`, `cloud-service-models`, `cloud-deployment-models`, `disaster-recovery`** remain Coming soon by design — tracked as future content, not defects.

## 11. Branch & commit

- Branch: `feat/cloud-fundamentals-final-qa` (from `main` @ `88e0122`)
- Changes: documentation only (this report, curriculum gap correction, roadmap status).
- Not merged, not deployed.
