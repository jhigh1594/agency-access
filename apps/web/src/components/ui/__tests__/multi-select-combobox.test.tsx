import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { MultiSelectCombobox } from '../multi-select-combobox';

function TestHarness() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <MultiSelectCombobox
      options={[
        {
          id: 'page_1001',
          name: 'DogTimez Facebook',
          description: 'Brand',
        },
      ]}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      placeholder="Select pages..."
    />
  );
}

describe('MultiSelectCombobox', () => {
  it('keeps portal option clicks inside the component and updates selection', async () => {
    const user = userEvent.setup();

    render(<TestHarness />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('DogTimez Facebook'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove dogtimez facebook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });
  });
});
