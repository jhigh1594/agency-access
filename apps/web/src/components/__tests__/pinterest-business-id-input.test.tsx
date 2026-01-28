import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinterestBusinessIdInput } from '../pinterest-business-id-input';

describe('PinterestBusinessIdInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display Pinterest Business ID input form', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText('Pinterest Business ID')).toBeInTheDocument();
    expect(screen.getByText(/Add your Pinterest Business ID/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business ID/)).toBeInTheDocument();
  });

  it('should show deep link to Pinterest Business Manager', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const link = screen.getByRole('link', { name: /Pinterest Business Manager/i });
    expect(link).toHaveAttribute('href', 'https://www.pinterest.com/business/business-manager/');
  });

  it('should validate Business ID format (numbers only)', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByRole('textbox', { name: /Business ID/i });
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    // Button should be disabled initially (empty input)
    expect(submitButton).toBeDisabled();

    // When typing mixed letters and numbers, letters should be filtered out
    await user.type(input, 'abc123');

    // Input should only contain numbers (letters filtered automatically)
    expect(input).toHaveValue('123');

    // Button should be enabled with valid numeric input (1-20 digits)
    expect(submitButton).toBeEnabled();
  });

  it('should accept valid Business ID format', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByRole('textbox', { name: /Business ID/i });
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    // Enter valid Business ID (numbers only)
    await user.type(input, '664351519939856629');

    // Button should be enabled
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('should call onSubmit with Business ID when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const input = screen.getByRole('textbox', { name: /Business ID/i });
    const submitButton = screen.getByRole('button', { name: /Continue/i });

    await user.type(input, '664351519939856629');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('664351519939856629');
    });
  });

  it('should call onSkip when Skip is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    const skipButton = screen.getByRole('button', { name: /Skip for now/i });
    await user.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should show instructions with example Business ID', () => {
    render(
      <PinterestBusinessIdInput
        agencyId="test-agency-id"
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />
    );

    expect(screen.getByText(/664351519939856629/)).toBeInTheDocument();
  });
});
