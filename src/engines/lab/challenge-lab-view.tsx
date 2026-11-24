import { useState } from 'react';
import type { ChallengeLab, ChallengeSolution } from '../../content/types';

interface ChallengeLabViewProps {
  content: ChallengeLab;
}

type Answer = string | string[];

function isMatch(given: Answer | undefined, expected: string | string[] | undefined): boolean {
  if (expected === undefined) return given === undefined;
  if (Array.isArray(expected)) {
    return Array.isArray(given) && given.length === expected.length && expected.every((v) => given.includes(v));
  }
  return given === expected;
}

export function ChallengeLabView({ content }: ChallengeLabViewProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<ChallengeSolution | 'unmatched' | null>(null);

  function setSingle(decisionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [decisionId]: value }));
    setResult(null);
  }

  function toggleMulti(decisionId: string, value: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[decisionId]) ? (prev[decisionId] as string[]) : [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [decisionId]: next };
    });
    setResult(null);
  }

  function evaluate() {
    const match = content.solutions.find((solution) =>
      content.decisions.every((decision) => isMatch(answers[decision.id], solution.decisionValues[decision.id])),
    );
    setResult(match ?? 'unmatched');
  }

  const allAnswered = content.decisions.every((decision) => {
    const value = answers[decision.id];
    return decision.type === 'multi-choice' ? Array.isArray(value) && value.length > 0 : typeof value === 'string';
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-[14px] font-medium text-text">Scenario</h3>
        <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">
          {content.scenario}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Requirements</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
            {content.requirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-[13px] font-medium text-text">Constraints</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-text-secondary">
            {content.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {content.decisions.map((decision) => (
        <fieldset key={decision.id} className="rounded-lg border border-border p-4">
          <legend className="text-[13px] font-medium text-text">{decision.question}</legend>
          <div className="mt-2 space-y-1.5">
            {decision.options.map((option) => {
              const checked =
                decision.type === 'multi-choice'
                  ? Array.isArray(answers[decision.id]) && (answers[decision.id] as string[]).includes(option.id)
                  : answers[decision.id] === option.id;
              return (
                <label key={option.id} className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <input
                    type={decision.type === 'multi-choice' ? 'checkbox' : 'radio'}
                    name={decision.id}
                    checked={checked}
                    onChange={() =>
                      decision.type === 'multi-choice'
                        ? toggleMulti(decision.id, option.id)
                        : setSingle(decision.id, option.id)
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-text">{option.label}</span> — {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <button
        onClick={evaluate}
        disabled={!allAnswered}
        className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40"
      >
        Evaluate My Design
      </button>

      {result === 'unmatched' && (
        <div className="rounded-lg border border-border bg-bg-subtle p-4 text-[13px] text-text-secondary">
          This combination isn&apos;t one of the pre-assessed designs. Check each requirement and constraint above
          against your choices individually — more than one reasonable design may exist.
        </div>
      )}

      {result && result !== 'unmatched' && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-[13px] font-medium text-text">
            Assessment: <span className="capitalize">{result.assessment}</span>
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">{result.explanation}</p>
          <p className="mt-1 text-[13px] text-text-muted">Trade-offs: {result.tradeoffs}</p>
        </div>
      )}
    </div>
  );
}
