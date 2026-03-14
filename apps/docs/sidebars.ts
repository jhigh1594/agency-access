import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  kbSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/create-your-first-request'],
    },
    {
      type: 'category',
      label: 'Requests & Links',
      items: [
        'requests-and-links/send-your-link',
        'requests-and-links/check-request-status',
        'requests-and-links/resend-or-revoke',
      ],
    },
    {
      type: 'category',
      label: 'Client Experience',
      items: [
        'client-experience/what-clients-see',
        'client-experience/agency-branding-basics',
        'client-experience/supported-platforms',
      ],
    },
    {
      type: 'category',
      label: 'Automation',
      items: ['automation/webhooks'],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/common-client-blockers',
        'troubleshooting/client-auth-issues',
      ],
    },
    {
      type: 'category',
      label: 'Security & Compliance',
      items: [
        'security-and-compliance/audit-logs-and-security',
        'security-and-compliance/request-expiration',
        'security-and-compliance/team-and-account-basics',
      ],
    },
  ],
};

export default sidebars;
