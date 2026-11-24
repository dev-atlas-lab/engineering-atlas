import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LessonNav } from './lesson-nav';
import { findConcept } from '../../content/cloud-fundamentals';

const concept = findConcept('cloud-fundamentals', 'compute', 'virtual-machines')!;

function renderNav(activeLessonId?: string, activeLabId?: string) {
  render(
    <MemoryRouter>
      <LessonNav
        domainId="cloud-fundamentals"
        categoryId="compute"
        concept={concept}
        activeLessonId={activeLessonId}
        activeLabId={activeLabId}
      />
    </MemoryRouter>,
  );
}

describe('LessonNav — Level 2 learning navigation', () => {
  it('lists every lesson and lab for the concept', () => {
    renderNav();
    for (const lesson of concept.lessons ?? []) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    }
    for (const lab of concept.labs ?? []) {
      expect(screen.getByText(lab.title)).toBeInTheDocument();
    }
  });

  it('every entry is a real, clickable link — never locked', () => {
    renderNav();
    const links = screen.getAllByRole('link');
    expect(links.length).toBe((concept.lessons?.length ?? 0) + (concept.labs?.length ?? 0));
    for (const link of links) {
      expect(link).toHaveAttribute('href');
    }
  });

  it('marks the active lesson with aria-current', () => {
    const active = concept.lessons![2]!;
    renderNav(active.id);
    expect(screen.getByText(active.title).closest('a')).toHaveAttribute('aria-current', 'page');
  });

  it('marks the active lab with aria-current', () => {
    const lab = concept.labs![0]!;
    renderNav(undefined, lab.id);
    expect(screen.getByText(lab.title).closest('a')).toHaveAttribute('aria-current', 'page');
  });

  it('links point to the correct lesson and lab routes', () => {
    renderNav();
    const firstLesson = concept.lessons![0]!;
    const lab = concept.labs![0]!;
    expect(screen.getByText(firstLesson.title).closest('a')).toHaveAttribute(
      'href',
      `/cloud-fundamentals/compute/virtual-machines/${firstLesson.id}`,
    );
    expect(screen.getByText(lab.title).closest('a')).toHaveAttribute(
      'href',
      `/cloud-fundamentals/compute/virtual-machines/labs/${lab.id}`,
    );
  });
});
