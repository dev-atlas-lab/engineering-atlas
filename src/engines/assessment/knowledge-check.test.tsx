import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KnowledgeCheck } from './knowledge-check';
import { useProgressStore } from '../../stores/progress-store';
import type { KnowledgeCheckQuestion } from '../../content/types';

const question: KnowledgeCheckQuestion = {
  id: 'q1',
  type: 'single-choice',
  prompt: 'Which option is correct?',
  difficulty: 'beginner',
  learningObjective: 'test objective',
  options: [
    { id: 'a', label: 'Right answer', correct: true, explanation: 'Because it is right.' },
    { id: 'b', label: 'Wrong answer', correct: false, explanation: 'Because it is wrong.' },
  ],
};

describe('KnowledgeCheck', () => {
  it('shows no explanations before submitting', () => {
    render(<KnowledgeCheck lessonId="lesson-1" questions={[question]} />);
    expect(screen.queryByText('Because it is right.')).not.toBeInTheDocument();
  });

  it('disables the submit button until an option is selected', () => {
    render(<KnowledgeCheck lessonId="lesson-1" questions={[question]} />);
    expect(screen.getByText('Check answer')).toBeDisabled();
  });

  it('reveals explanations for every option after submitting', async () => {
    const user = userEvent.setup();
    render(<KnowledgeCheck lessonId="lesson-1" questions={[question]} />);

    await user.click(screen.getByText('Right answer'));
    await user.click(screen.getByText('Check answer'));

    expect(screen.getByText('Because it is right.')).toBeInTheDocument();
    expect(screen.getByText('Because it is wrong.')).toBeInTheDocument();
  });

  it('records a correct answer in the progress store', async () => {
    const user = userEvent.setup();
    render(<KnowledgeCheck lessonId="lesson-record-correct" questions={[question]} />);

    await user.click(screen.getByText('Right answer'));
    await user.click(screen.getByText('Check answer'));

    expect(useProgressStore.getState().knowledgeCheckResults['lesson-record-correct']?.q1).toBe(true);
  });

  it('records an incorrect answer in the progress store', async () => {
    const user = userEvent.setup();
    render(<KnowledgeCheck lessonId="lesson-record-incorrect" questions={[question]} />);

    await user.click(screen.getByText('Wrong answer'));
    await user.click(screen.getByText('Check answer'));

    expect(useProgressStore.getState().knowledgeCheckResults['lesson-record-incorrect']?.q1).toBe(false);
  });

  it('locks option selection after submitting', async () => {
    const user = userEvent.setup();
    render(<KnowledgeCheck lessonId="lesson-1" questions={[question]} />);

    await user.click(screen.getByText('Right answer'));
    await user.click(screen.getByText('Check answer'));

    const inputs = screen.getAllByRole('radio') as HTMLInputElement[];
    for (const input of inputs) {
      expect(input).toBeDisabled();
    }
  });
});
