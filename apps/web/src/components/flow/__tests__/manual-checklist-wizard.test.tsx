import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualChecklistWizard } from '../manual-checklist-wizard';

function buildSteps(onFinal: () => void) {
  const gate = {
    checked: false,
    label: 'I completed this step',
    onChange: vi.fn(),
    requiredMessage: 'Please confirm completion before continuing.',
  };

  return {
    gate,
    steps: [
      {
        id: 'copy-email',
        title: 'Copy agency email',
        description: 'Copy the invite identity.',
        content: <p>Step 1 content</p>,
        primaryAction: { label: 'Next' },
      },
      {
        id: 'confirm-complete',
        title: 'Confirm completion',
        description: 'Confirm you sent invite.',
        content: <p>Step 2 content</p>,
        completionGate: gate,
        primaryAction: { label: 'Continue', onClick: onFinal },
      },
    ],
  };
}

describe('ManualChecklistWizard', () => {
  it('advances to the next step when Next is clicked', async () => {
    const user = userEvent.setup();
    const { steps } = buildSteps(vi.fn());

    render(<ManualChecklistWizard platformName="Beehiiv" steps={steps} />);

    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
  });

  it('blocks final action until completion gate is checked', async () => {
    const user = userEvent.setup();
    const onFinal = vi.fn();
    const { steps, gate } = buildSteps(onFinal);

    render(<ManualChecklistWizard platformName="Beehiiv" steps={steps} />);

    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Continue' })[0]);

    expect(screen.getByText('Please confirm completion before continuing.')).toBeInTheDocument();
    expect(onFinal).not.toHaveBeenCalled();

    gate.checked = true;
    await user.click(screen.getAllByRole('button', { name: 'Continue' })[0]);
    expect(onFinal).toHaveBeenCalledTimes(1);
  });

  it('emits step view and step advance callbacks', async () => {
    const user = userEvent.setup();
    const onStepView = vi.fn();
    const onStepAdvanced = vi.fn();
    const { steps } = buildSteps(vi.fn());

    render(
      <ManualChecklistWizard
        platformName="Beehiiv"
        steps={steps}
        onStepView={onStepView}
        onStepAdvanced={onStepAdvanced}
      />
    );

    expect(onStepView).toHaveBeenCalledWith(
      expect.objectContaining({
        stepId: 'copy-email',
        stepIndex: 0,
      })
    );

    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);

    expect(onStepAdvanced).toHaveBeenCalledWith(
      expect.objectContaining({
        fromStepId: 'copy-email',
        toStepId: 'confirm-complete',
      })
    );
  });
});
