import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

function StatefulChecklist({ onFinal }: { onFinal: () => void }) {
  const [checked, setChecked] = useState(false);

  const steps = [
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
      completionGate: {
        checked,
        label: 'I completed this step',
        onChange: setChecked,
        requiredMessage: 'Please confirm completion before continuing.',
      },
      primaryAction: { label: 'Continue', onClick: onFinal },
    },
  ];

  return <ManualChecklistWizard platformName="Beehiiv" steps={steps} />;
}

describe('ManualChecklistWizard', () => {
  it('advances to the next step when Next is clicked', async () => {
    const user = userEvent.setup();
    const { steps } = buildSteps(vi.fn());

    render(<ManualChecklistWizard platformName="Beehiiv" steps={steps} />);

    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
  });

  it('keeps the final action disabled until completion gate is checked', async () => {
    const user = userEvent.setup();
    const onFinal = vi.fn();

    render(<StatefulChecklist onFinal={onFinal} />);

    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    const continueButtons = screen.getAllByRole('button', { name: 'Continue' });
    expect(continueButtons[0]).toBeDisabled();

    expect(onFinal).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: /i completed this step/i }));
    expect(screen.getAllByRole('button', { name: 'Continue' })[0]).not.toBeDisabled();
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

  it('uses compact mobile-only header treatments to bring the step action higher in the viewport', () => {
    const { container } = render(<ManualChecklistWizard platformName="Beehiiv" steps={buildSteps(vi.fn()).steps} />);

    const mobileDescription = container.querySelector('[data-hide-on-mobile-description="true"]');
    const mobileProgressBar = container.querySelector('[data-hide-on-mobile-progress="true"]');

    expect(mobileDescription?.className).toContain('hidden');
    expect(mobileDescription?.className).toContain('sm:block');
    expect(mobileProgressBar?.className).toContain('hidden');
    expect(mobileProgressBar?.className).toContain('sm:block');
  });
});
