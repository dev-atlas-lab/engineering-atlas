import { useState } from 'react';
import { useProgressStore } from '../../stores/progress-store';
import type { KnowledgeCheckQuestion } from '../../content/types';

interface KnowledgeCheckProps {
  lessonId: string;
  questions: KnowledgeCheckQuestion[];
}

export function KnowledgeCheck({ lessonId, questions }: KnowledgeCheckProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-medium text-text">Knowledge Check</h3>
      {questions.map((question) => (
        <KnowledgeCheckQuestionView key={question.id} lessonId={lessonId} question={question} />
      ))}
    </div>
  );
}

function KnowledgeCheckQuestionView({
  lessonId,
  question,
}: {
  lessonId: string;
  question: KnowledgeCheckQuestion;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const recordAnswer = useProgressStore((s) => s.recordKnowledgeCheckAnswer);

  const isMulti = question.type === 'multi-select';

  function toggle(optionId: string) {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(isMulti ? prev : []);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  function submit() {
    setSubmitted(true);
    const correctIds = new Set(question.options.filter((o) => o.correct).map((o) => o.id));
    const isCorrect = selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
    recordAnswer(lessonId, question.id, isCorrect);
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-[13px] font-medium text-text">{question.prompt}</p>
      <div className="mt-2 space-y-1.5">
        {question.options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <label
              key={option.id}
              className={`flex items-start gap-2 rounded-md px-2 py-1 text-[13px] ${
                submitted && option.correct ? 'bg-success/10' : ''
              } ${submitted && isSelected && !option.correct ? 'bg-error/10' : ''}`}
            >
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                name={question.id}
                checked={isSelected}
                disabled={submitted}
                onChange={() => toggle(option.id)}
                className="mt-0.5"
              />
              <span className="text-text-secondary">
                <span className="font-medium text-text">{option.label}</span>
                {submitted && <span className="mt-0.5 block text-[12px] text-text-muted">{option.explanation}</span>}
              </span>
            </label>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="mt-3 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-text hover:bg-accent-hover disabled:opacity-40"
        >
          Check answer
        </button>
      ) : (
        <p className="mt-3 text-[12px] text-text-muted">
          Difficulty: {question.difficulty} · assesses: {question.learningObjective}
        </p>
      )}
    </div>
  );
}
