import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'b10'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '399'),
        routes: [
          {
            path: '/tags',
            component: ComponentCreator('/tags', 'ce1'),
            exact: true
          },
          {
            path: '/tags/automation',
            component: ComponentCreator('/tags/automation', 'b06'),
            exact: true
          },
          {
            path: '/tags/branding',
            component: ComponentCreator('/tags/branding', '068'),
            exact: true
          },
          {
            path: '/tags/client-experience',
            component: ComponentCreator('/tags/client-experience', '7e5'),
            exact: true
          },
          {
            path: '/tags/onboarding',
            component: ComponentCreator('/tags/onboarding', 'b8e'),
            exact: true
          },
          {
            path: '/tags/overview',
            component: ComponentCreator('/tags/overview', '55f'),
            exact: true
          },
          {
            path: '/tags/platforms',
            component: ComponentCreator('/tags/platforms', '996'),
            exact: true
          },
          {
            path: '/tags/requests',
            component: ComponentCreator('/tags/requests', 'be0'),
            exact: true
          },
          {
            path: '/tags/security',
            component: ComponentCreator('/tags/security', '84b'),
            exact: true
          },
          {
            path: '/tags/troubleshooting',
            component: ComponentCreator('/tags/troubleshooting', '220'),
            exact: true
          },
          {
            path: '/tags/webhooks',
            component: ComponentCreator('/tags/webhooks', '424'),
            exact: true
          },
          {
            path: '/',
            component: ComponentCreator('/', '8e5'),
            routes: [
              {
                path: '/automation/webhooks',
                component: ComponentCreator('/automation/webhooks', '2a1'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/client-experience/agency-branding-basics',
                component: ComponentCreator('/client-experience/agency-branding-basics', '30b'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/client-experience/supported-platforms',
                component: ComponentCreator('/client-experience/supported-platforms', '415'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/client-experience/what-clients-see',
                component: ComponentCreator('/client-experience/what-clients-see', '5a4'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/getting-started/create-your-first-request',
                component: ComponentCreator('/getting-started/create-your-first-request', '0ea'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/requests-and-links/check-request-status',
                component: ComponentCreator('/requests-and-links/check-request-status', '19a'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/requests-and-links/resend-or-revoke',
                component: ComponentCreator('/requests-and-links/resend-or-revoke', 'fe0'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/requests-and-links/send-your-link',
                component: ComponentCreator('/requests-and-links/send-your-link', 'cf9'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/security-and-compliance/audit-logs-and-security',
                component: ComponentCreator('/security-and-compliance/audit-logs-and-security', 'cad'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/security-and-compliance/request-expiration',
                component: ComponentCreator('/security-and-compliance/request-expiration', '6f7'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/security-and-compliance/team-and-account-basics',
                component: ComponentCreator('/security-and-compliance/team-and-account-basics', 'e15'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/troubleshooting/client-auth-issues',
                component: ComponentCreator('/troubleshooting/client-auth-issues', 'fc2'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/troubleshooting/common-client-blockers',
                component: ComponentCreator('/troubleshooting/common-client-blockers', 'e4c'),
                exact: true,
                sidebar: "kbSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '19e'),
                exact: true,
                sidebar: "kbSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
