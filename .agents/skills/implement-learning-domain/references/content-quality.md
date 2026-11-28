# Content Quality Reference

Deep reference for lesson authoring. Load only when writing lesson bodies.

## The ten-point coverage, across a concept

A concept's lessons together should cover these; not every single lesson needs
every point, and the depth is proportional to the topic:

1. **What it is** — definition grounded in the mechanism, not a dictionary gloss.
2. **Why it exists** — the motivating pressure or constraint.
3. **The problem it solves** — concrete pain without it.
4. **How it works internally** — the mechanism, not the UX.
5. **Architecture and lifecycle** — components, state transitions, who talks
   to whom.
6. **Practical examples** — realistic configurations, commands, outputs.
7. **Failure modes** — what goes wrong and how to recognize it.
8. **Troubleshooting** — where to look, what to try, what logs to read.
9. **Common misconceptions** — the wrong mental models that cost time.
10. **Knowledge checks** — meaningful questions, not word-matching.

## Depth signals

Lessons feel shallow when they:

- Define the term and move on without saying why it exists.
- Describe the UX of a provider's console but never the mechanism.
- Compare providers by feature list without explaining architectural differences.
- Treat every option as equivalent instead of surfacing the actual trade-off.
- Hedge every claim with "it depends" and never commit to a recommendation.

Lessons read well when they:

- Explain a mechanism in enough detail that a reader can predict new behavior.
- Name specific failure modes the reader has probably hit.
- Show what the vendor documentation leaves implicit (why a limit exists, why
  the service is structured this way).
- Distinguish provider terminology from the common concept explicitly.

## Section composition (data-driven blocks)

A lesson is a `LessonSection[]`. Each section has a `heading` and a list of
`ContentBlock`s. The blocks:

- `paragraph` — the default. Keep each paragraph focused.
- `list` — enumerate related items. Use `ordered: true` for stepwise.
- `code` — commands, YAML, configuration snippets. Set `language` and
  `caption`.
- `callout` — `info`, `warning`, or `success`. Use sparingly; the warning
  callout is for genuine footguns.
- `comparisonTable` — structured comparison across providers or options.
  Headers go in order; rows in the same order as headers.

Section heading conventions are flexible per lesson. Common ones: "What it
is", "Why it matters", "How it works", "Architecture", "Lifecycle",
"Example", "Failure modes", "Troubleshooting", "Common misconceptions".

## Provider lessons

`kind: 'provider'` lessons attach `providerDetails:
ProviderImplementationDetails`:

- `serviceName` — the vendor's official current name.
- `keyFeatures` — provider-specific capabilities, phrased concretely.
- `terminology` — common term → provider term map. Always from common to
  provider, not the other way.
- `architecturalNotes` — how this implementation differs structurally from
  the common concept.
- `limitations` — real constraints, not marketing hedges.
- `documentationUrl` — the current canonical vendor page.

## Knowledge check quality

Every `KnowledgeCheckQuestion`:

- Has a clear single-sentence `prompt`.
- Has plausible distractors — wrong for a real reason, not nonsense.
- Each `QuestionOption` carries an `explanation` that teaches the underlying
  reason. The correct option's explanation says why; the wrong options'
  explanations say what's wrong with the mental model behind them.
- `difficulty` reflects actual demand on the reader.
- `learningObjective` is a sentence a reader could tick off, not a restatement
  of the prompt.
