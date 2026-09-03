import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PlatformsPage from '../page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('Settings Platforms Page', () => {
  it('redirects to the current connections page', async () => {
    render(<PlatformsPage />);

    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/connections'));
  });
});
