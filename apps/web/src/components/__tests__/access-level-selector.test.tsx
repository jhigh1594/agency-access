import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessLevelSelector } from '../access-level-selector';
import { ACCESS_LEVEL_DESCRIPTIONS } from '@agency-platform/shared';

describe('AccessLevelSelector', () => {
  it('renders the current combobox contract', async () => {
    const user = userEvent.setup();
    render(<AccessLevelSelector onSelectionChange={vi.fn()} />);

    const combobox = screen.getByRole('combobox', { name: 'Default Access Level' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.click(combobox);
    expect(screen.getAllByRole('option')).toHaveLength(Object.keys(ACCESS_LEVEL_DESCRIPTIONS).length);
    expect(screen.getByRole('option', { name: /Admin Access/ })).toBeInTheDocument();
  });

  it('reports a selected level and displays its permissions', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(<AccessLevelSelector onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Default Access Level' }));
    await user.click(screen.getByRole('option', { name: /Admin Access/ }));
    expect(onSelectionChange).toHaveBeenCalledWith('admin');

    rerender(<AccessLevelSelector selectedAccessLevel="admin" onSelectionChange={onSelectionChange} />);
    expect(screen.getByText('Permissions included:')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('supports a pre-selected level without opening the menu', () => {
    render(<AccessLevelSelector selectedAccessLevel="read_only" />);

    expect(screen.getByRole('combobox')).toHaveTextContent(/Read Only/);
    expect(screen.getByText('Permissions included:')).toBeInTheDocument();
  });
});
