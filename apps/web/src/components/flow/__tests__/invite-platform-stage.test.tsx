import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InvitePlatformStage } from '../invite-platform-stage';

describe('InvitePlatformStage', () => {
  it('renders the active task before the queue banner in DOM order for mobile-first action priority', () => {
    const { container } = render(
      <InvitePlatformStage
        platformName="Google"
        description="Complete this step, then continue to Beehiiv."
        remainingCount={2}
        completedCount={0}
        totalCount={3}
        nextPlatformName="Beehiiv"
      >
        <div>Active connect task</div>
      </InvitePlatformStage>
    );

    expect(container.innerHTML.indexOf('Active connect task')).toBeLessThan(
      container.innerHTML.indexOf('Now connecting')
    );
  });
});
