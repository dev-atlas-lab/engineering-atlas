import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChallengeLabView } from './challenge-lab-view';
import type { ChallengeLab } from '../../content/types';

const lab: ChallengeLab = {
  scenario: 'A small app with weaknesses.',
  requirements: ['Be secure'],
  constraints: ['Small team'],
  decisions: [
    {
      id: 'identity',
      question: 'Identity changes',
      type: 'multi-choice',
      options: [
        { id: 'mfa', label: 'Require MFA', description: 'For admins.', feedback: { rating: 'effective', text: 'Stops phished passwords.' } },
        { id: 'jit', label: 'Just-in-time access', description: 'Elevate on demand.', feedback: { rating: 'effective', text: 'Removes standing access.' } },
        { id: 'shared', label: 'Shared admin', description: 'One account.', feedback: { rating: 'ineffective', text: 'Destroys accountability.' } },
      ],
    },
  ],
  solutions: [
    { id: 'best', decisionValues: { identity: ['mfa', 'jit'] }, assessment: 'optimal', explanation: 'Both effective controls.', tradeoffs: 'Some friction.' },
  ],
};

describe('ChallengeLabView per-option feedback', () => {
  it('gives an authored verdict for an authored combination, plus feedback on each choice', async () => {
    const user = userEvent.setup();
    render(<ChallengeLabView content={lab} />);
    await user.click(screen.getByLabelText(/Require MFA/));
    await user.click(screen.getByLabelText(/Just-in-time access/));
    await user.click(screen.getByRole('button', { name: 'Evaluate My Design' }));
    expect(screen.getByText(/Assessment of this exact combination/)).toHaveTextContent('optimal');
    expect(screen.getByText('Feedback on each choice')).toBeInTheDocument();
    expect(screen.getByText(/Stops phished passwords/)).toBeInTheDocument();
  });

  it('gives no overall verdict for an unauthored combination, but still per-choice feedback and missed effective options', async () => {
    const user = userEvent.setup();
    render(<ChallengeLabView content={lab} />);
    await user.click(screen.getByLabelText(/Shared admin/));
    await user.click(screen.getByRole('button', { name: 'Evaluate My Design' }));
    expect(screen.queryByText(/Assessment of this exact combination/)).not.toBeInTheDocument();
    expect(screen.getByText(/no authored overall assessment/)).toBeInTheDocument();
    expect(screen.getByText(/Destroys accountability/)).toBeInTheDocument();
    expect(screen.getByText(/Ineffective or harmful/)).toBeInTheDocument();
    expect(screen.getByText('Not selected: Require MFA')).toBeInTheDocument();
    expect(screen.getByText('Not selected: Just-in-time access')).toBeInTheDocument();
  });

  it('shows no feedback before evaluation, and keeps the original wording for labs without option feedback', async () => {
    const user = userEvent.setup();
    const plain: ChallengeLab = {
      ...lab,
      decisions: [{ ...lab.decisions[0]!, options: lab.decisions[0]!.options.map((o) => ({ id: o.id, label: o.label, description: o.description })) }],
    };
    render(<ChallengeLabView content={plain} />);
    expect(screen.queryByText('Feedback on each choice')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText(/Shared admin/));
    await user.click(screen.getByRole('button', { name: 'Evaluate My Design' }));
    expect(screen.getByText(/isn’t one of the pre-assessed designs/)).toBeInTheDocument();
    expect(screen.queryByText('Feedback on each choice')).not.toBeInTheDocument();
  });
});
