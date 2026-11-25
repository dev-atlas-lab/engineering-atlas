import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from './routes';
import { conceptLoaders } from '../content/cloud-fundamentals/concept-loaders';
import { useProgressStore } from '../stores/progress-store';

// Integration tests for the per-concept loading boundary, run against the
// real route tree and the real loader registry. Each concept loader is
// spied on so a test can assert exactly which concepts were downloaded.
// The loader caches across tests in this file (as it does in the app), so
// each test uses concepts no earlier test has loaded.

const spies = Object.fromEntries(
  Object.keys(conceptLoaders).map((id) => [id, vi.spyOn(conceptLoaders, id)]),
) as Record<string, ReturnType<typeof vi.spyOn>>;

function loadedConceptIds(): string[] {
  return Object.entries(spies)
    .filter(([, spy]) => spy.mock.calls.length > 0)
    .map(([id]) => id);
}

afterEach(() => {
  for (const spy of Object.values(spies)) spy.mockClear();
});

async function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('main');
  return router;
}

async function waitForLessonBody() {
  await waitFor(() => expect(screen.queryByText('Loading lesson content…')).not.toBeInTheDocument());
}

describe('discovery pages render from metadata alone', () => {
  it.each([
    ['Home', '/', /active · .* coming soon/],
    ['the domain page', '/cloud-fundamentals', /4 active/],
    ['a category page', '/cloud-fundamentals/storage', /Block Storage/],
    ['a Coming-soon concept', '/cloud-fundamentals/security/network-security', /planned but not yet started/],
  ])('%s loads no concept content', async (_name, path, expected) => {
    await renderApp(path);
    expect(await screen.findByText(expected)).toBeInTheDocument();
    // Give any stray effect a chance to start a load before asserting none did.
    await act(async () => {});
    expect(loadedConceptIds()).toEqual([]);
  });

  it('a Coming-soon concept shows its status, not a loading state', async () => {
    await renderApp('/cloud-fundamentals/load-balancing/network-load-balancing');
    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('concept and lesson routes load only their own concept', () => {
  it('the concept overview renders from metadata and prefetches only that concept', async () => {
    await renderApp('/cloud-fundamentals/networking/connecting-networks');
    expect(await screen.findByText('Learning Objectives')).toBeInTheDocument();
    await waitFor(() => expect(loadedConceptIds()).toEqual(['connecting-networks']));
  });

  it('a lesson deep link loads only its concept, with breadcrumbs from metadata', async () => {
    await renderApp('/cloud-fundamentals/storage/object-storage/how-object-storage-works');
    await waitForLessonBody();
    expect(screen.getByText(/flat namespace inside a top-level container/)).toBeInTheDocument();
    expect(loadedConceptIds()).toEqual(['object-storage']);

    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByText('Storage')).toBeInTheDocument();
    expect(crumbs.getByText('Object Storage')).toBeInTheDocument();
    expect(crumbs.getByText('How Object Storage Works')).toBeInTheDocument();
  });

  it('moving to the next lesson of the same concept does not download it again', async () => {
    const user = userEvent.setup();
    await renderApp('/cloud-fundamentals/global-infrastructure/data-centers-and-edge-locations/inside-a-cloud-datacenter');
    await waitForLessonBody();
    expect(spies['data-centers-and-edge-locations']).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Edge Locations and Points of Presence →'));
    // Already cached: the next lesson's body is there with no loading state.
    expect(screen.queryByText('Loading lesson content…')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edge Locations and Points of Presence' })).toBeInTheDocument();
    expect(spies['data-centers-and-edge-locations']).toHaveBeenCalledTimes(1);
  });

  it('switching to another concept loads that concept and shows its content, never the previous one', async () => {
    const router = await renderApp('/cloud-fundamentals/compute/serverless-functions/introduction-to-serverless');
    await waitForLessonBody();
    expect(screen.getByText(/does not mean no servers/)).toBeInTheDocument();

    await act(() => router.navigate('/cloud-fundamentals/storage/file-storage/how-file-storage-works'));
    await waitForLessonBody();
    expect(screen.getByRole('heading', { name: 'How Managed File Storage Works' })).toBeInTheDocument();
    expect(screen.getByText(/A filesystem served over the network/)).toBeInTheDocument();
    expect(screen.queryByText(/does not mean no servers/)).not.toBeInTheDocument();
    expect(loadedConceptIds().sort()).toEqual(['file-storage', 'serverless-functions']);
  });

  it('a lab deep link loads only its concept and renders the simulation', async () => {
    await renderApp('/cloud-fundamentals/networking/subnets-and-routing/labs/packet-routing-lab');
    expect(await screen.findByText('Packet to send')).toBeInTheDocument();
    expect(loadedConceptIds()).toEqual(['subnets-and-routing']);
  });

  it('an unknown lesson id is Not Found without downloading anything', async () => {
    await renderApp('/cloud-fundamentals/storage/block-storage/no-such-lesson');
    expect(await screen.findByText('Page Not Found')).toBeInTheDocument();
    expect(loadedConceptIds()).toEqual([]);
  });
});

describe('loading failures', () => {
  it('shows a recoverable error — not “Coming soon” — when a concept’s content fails to download', async () => {
    const user = userEvent.setup();
    spies['dns-and-content-delivery']!.mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'));
    await renderApp('/cloud-fundamentals/networking/dns-and-content-delivery/how-dns-resolution-works');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('could not be downloaded');
    expect(alert).toHaveTextContent(/network problem/);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
    // The lesson's title and navigation still come from metadata.
    expect(screen.getByRole('heading', { name: 'How DNS Resolution Works' })).toBeInTheDocument();
    // A lesson whose content never appeared is not recorded as viewed.
    expect(useProgressStore.getState().completedLessons['how-dns-resolution-works']).toBeUndefined();

    // Recovery is a full page reload: Chromium caches a failed dynamic import
    // for the life of the page, so an in-place retry could never succeed.
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    await user.click(within(alert).getByRole('button', { name: /Reload and try again/ }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();

    // The reloaded page (modelled as a fresh mount of the same URL) loads the
    // content, and only then is the lesson recorded as viewed.
    cleanup();
    await renderApp('/cloud-fundamentals/networking/dns-and-content-delivery/how-dns-resolution-works');
    await waitForLessonBody();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/distributed, delegated database/i)).toBeInTheDocument();
    expect(spies['dns-and-content-delivery']).toHaveBeenCalledTimes(2);
    expect(useProgressStore.getState().completedLessons['how-dns-resolution-works']).toBe(true);
  });
});
