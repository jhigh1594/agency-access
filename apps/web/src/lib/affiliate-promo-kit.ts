export const AFFILIATE_PROMO_KIT = {
  positioningSummary:
    'AuthHub helps agencies replace screenshot-based client access onboarding with one branded authorization link that works across Meta, Google Ads, GA4, LinkedIn, TikTok, Shopify, and more.',
  objectionHandling: [
    'Lead with speed: agencies stop chasing passwords, screenshots, and one-off admin instructions.',
    'Lead with client trust: clients authorize access directly in the platform instead of sending credentials.',
    'Lead with scale: the same branded workflow works across major ad and analytics platforms.',
  ],
  ctaVariants: [
    'See how AuthHub replaces screenshot-based client onboarding',
    'Send one branded authorization link instead of setup instructions',
    'Standardize client access onboarding before your next growth sprint',
  ],
  emailSwipe: {
    title: 'Email outreach swipe',
    subject: 'A cleaner way to onboard client access without screenshot tutorials',
    body:
      'If your team is still collecting client access through email threads, screenshots, and manual follow-up, AuthHub is worth a look. It gives agencies one branded authorization flow for platforms like Meta, Google Ads, GA4, LinkedIn, TikTok, and Shopify so clients can grant the right access without sharing passwords. The result is less onboarding drag, fewer permission mistakes, and a cleaner client experience.',
  },
  socialSwipe: {
    title: 'Social post swipe',
    body:
      'Most agencies do not have a client-acquisition problem. They have a client-onboarding drag problem. AuthHub replaces the screenshot docs, access-request emails, and permission chasing with one branded authorization link so clients can grant the right platform access without sending passwords.',
  },
  launchChecklist: [
    'Open with the operational pain: screenshot guides, access confusion, and slow client kickoff.',
    'Show the branded authorization link before explaining the affiliate program itself.',
    'Use a platform list to make the cross-channel value concrete.',
    'Close with the workflow outcome: faster onboarding, fewer mistakes, and cleaner client trust.',
  ],
} as const;

export function buildAffiliateEmailSwipeText() {
  return [
    `Subject: ${AFFILIATE_PROMO_KIT.emailSwipe.subject}`,
    '',
    AFFILIATE_PROMO_KIT.emailSwipe.body,
  ].join('\n');
}

export function buildAffiliateSocialSwipeText() {
  return AFFILIATE_PROMO_KIT.socialSwipe.body;
}

export function buildAffiliatePositioningText() {
  return [
    AFFILIATE_PROMO_KIT.positioningSummary,
    '',
    'CTA variants:',
    ...AFFILIATE_PROMO_KIT.ctaVariants.map((item) => `- ${item}`),
  ].join('\n');
}
