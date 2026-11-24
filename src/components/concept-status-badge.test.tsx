import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConceptStatusBadge } from './concept-status-badge';

describe('ConceptStatusBadge', () => {
  it.each([
    ['available', 'Active'],
    ['in-development', 'In development'],
    ['coming-soon', 'Coming soon'],
  ])('renders %s as "%s" in readable text', (status, label) => {
    render(<ConceptStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute('data-status', status);
  });

  it('renders an unknown status as Coming soon instead of crashing', () => {
    render(<ConceptStatusBadge status="published" />);
    expect(screen.getByText('Coming soon')).toHaveAttribute('data-status', 'coming-soon');
  });

  it('renders a missing status as Coming soon instead of crashing', () => {
    render(<ConceptStatusBadge status={undefined} />);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('keeps label text on theme text tokens, so contrast holds in light and dark themes', () => {
    // Colour is carried by the dot and border; the text uses text-text /
    // text-text-secondary, which both themes redefine with AA contrast.
    render(<ConceptStatusBadge status="available" />);
    expect(screen.getByText('Active').className).toMatch(/\btext-text\b/);
    render(<ConceptStatusBadge status="coming-soon" />);
    expect(screen.getByText('Coming soon').className).toMatch(/\btext-text-secondary\b/);
  });
});
