import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HandsOnLabView } from './hands-on-lab-view';
import type { HandsOnLab, LabDefinition } from '../../content/types';

const content: HandsOnLab = {
  environment: [{ tool: 'bash', installUrl: 'https://example.com', verifyCommand: 'echo ok' }],
  starterFiles: [{ filename: 'token.txt', content: 'aaaa.bbbb.cccc', description: 'A sample token.' }],
  tasks: [{ id: 't1', title: 'Decode it', instructions: 'Run the command.', commands: [{ command: 'cat token.txt', description: 'Show it.' }], hints: [], validationChecklist: ['Saw it'] }],
};

const lab: LabDefinition = {
  id: 'test-hands-on-lab',
  title: 'Test lab',
  type: 'hands-on',
  difficulty: 'beginner',
  estimatedTime: '5 minutes',
  description: 'A test.',
  learningObjectives: [],
  prerequisites: [],
  content,
};

describe('HandsOnLabView', () => {
  it('renders starter files with their name, description, and content', () => {
    render(<HandsOnLabView lab={lab} content={content} />);
    expect(screen.getByText('Starter files')).toBeInTheDocument();
    expect(screen.getByText('token.txt')).toBeInTheDocument();
    expect(screen.getByText('aaaa.bbbb.cccc')).toBeInTheDocument();
  });

  it('omits the starter files section when a lab has none, and stays self-reported', () => {
    render(<HandsOnLabView lab={lab} content={{ ...content, starterFiles: undefined }} />);
    expect(screen.queryByText('Starter files')).not.toBeInTheDocument();
    expect(screen.getByText(/Self-reported — not automatically verified/)).toBeInTheDocument();
  });
});
