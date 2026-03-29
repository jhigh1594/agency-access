import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import InviteTokenLoading from '../loading';

describe('Invite token route loading UI', () => {
  it('renders skeleton placeholders while invite payload is loading', () => {
    const { container } = render(<InviteTokenLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
