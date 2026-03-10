import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StepHelpText } from '../StepHelpText';

describe('StepHelpText', () => {
  it('toggles the help content when the header is clicked', async () => {
    const user = userEvent.setup();
    const title = 'What happens when you click Connect?';

    render(
      <StepHelpText
        title={title}
        description="You will be redirected to sign in."
        steps={['Sign in', 'Approve access']}
      />
    );

    const trigger = screen.getByRole('button', { name: title });
    const content = document.getElementById(trigger.getAttribute('aria-controls') || '');
    expect(content).toHaveAttribute('hidden');

    await user.click(trigger);
    expect(content).not.toHaveAttribute('hidden');
    expect(screen.getByText(/what happens next:/i)).toBeInTheDocument();
    expect(screen.getByText(/you will be redirected to sign in/i)).toBeInTheDocument();

    await user.click(trigger);
    expect(content).toHaveAttribute('hidden');
  });

  it('starts expanded when defaultOpen is true', () => {
    render(
      <StepHelpText
        title="What happens when you click Connect?"
        description="You will be redirected to sign in."
        steps={['Sign in', 'Approve access']}
        defaultOpen
      />
    );

    expect(screen.getByText(/what happens next:/i)).toBeInTheDocument();
  });
});
