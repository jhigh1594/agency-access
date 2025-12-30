/**
 * Instruction Generation Service
 *
 * Generates platform-specific step-by-step instructions for clients
 * to authorize agencies via platform-native authorization flow.
 *
 * Each instruction includes:
 * - Numbered steps with descriptions
 * - Screenshot references for visual guidance
 * - Agency-specific data interpolation (email, Business ID)
 * - Access level-specific permission descriptions
 * - Additional notes and tips
 */

import type { AccessLevel } from '@agency-platform/shared';

export interface InstructionStep {
  number: number;
  title: string;
  description: string;
  screenshotRef: string;
  screenshotUrl: string;
}

export interface PlatformInstructions {
  platform: string;
  platformName: string;
  agencyIdentity: {
    email?: string;
    businessId?: string;
  };
  accessLevel: AccessLevel;
  steps: InstructionStep[];
  additionalNotes: string[];
}

export interface GenerateInstructionsInput {
  platform: string;
  platformName: string;
  agencyIdentity: {
    email?: string;
    businessId?: string;
  };
  accessLevel: AccessLevel;
  agency: {
    name: string;
    logoUrl?: string;
  };
}

// Platform-specific instruction templates
const INSTRUCTION_TEMPLATES: Record<string, (data: GenerateInstructionsInput) => Omit<PlatformInstructions, 'platform' | 'platformName' | 'agencyIdentity' | 'accessLevel'>> = {
  meta_ads: (data) => ({
    steps: [
      {
        number: 1,
        title: 'Open Meta Business Suite',
        description: 'Navigate to https://business.facebook.com/settings in your browser and log in with your Meta account.',
        screenshotRef: 'meta_business_suite_home.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_business_suite_home.png',
      },
      {
        number: 2,
        title: 'Go to Business Settings',
        description: 'In the left sidebar, click on "Business Settings" to access your business configuration.',
        screenshotRef: 'meta_business_settings.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_business_settings.png',
      },
      {
        number: 3,
        title: 'Navigate to People',
        description: 'Under "Users" section, click on "People" to manage user access.',
        screenshotRef: 'meta_people_section.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_people_section.png',
      },
      {
        number: 4,
        title: 'Add the Agency as a Partner',
        description: `Click the "Add People" button and enter the agency's Business Manager ID: ${data.agencyIdentity.businessId}. Select the appropriate access level: ${getAccessLevelDescription(data.accessLevel)}.`,
        screenshotRef: 'meta_add_people.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_add_people.png',
      },
      {
        number: 5,
        title: 'Select Ad Accounts to Share',
        description: 'Choose which ad accounts you want to grant access to. You can select all accounts or specific ones.',
        screenshotRef: 'meta_select_accounts.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_select_accounts.png',
      },
      {
        number: 6,
        title: 'Confirm and Send Invitation',
        description: 'Review the permissions and click "Confirm" to send the invitation to the agency.',
        screenshotRef: 'meta_confirm_invitation.png',
        screenshotUrl: '/instructions/screenshots/meta/meta_confirm_invitation.png',
      },
    ],
    additionalNotes: [
      'The agency will receive a notification once you\'ve granted access.',
      'You can modify or revoke access at any time from Business Settings.',
      'Make sure to grant access to the correct Business Manager ID.',
    ],
  }),

  google_ads: (data) => ({
    steps: [
      {
        number: 1,
        title: 'Open Google Ads',
        description: 'Navigate to https://ads.google.com and log in with your Google account.',
        screenshotRef: 'google_ads_home.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_home.png',
      },
      {
        number: 2,
        title: 'Go to Tools & Settings',
        description: 'Click the "Tools and settings" icon (wrench) in the top right corner of the page.',
        screenshotRef: 'google_ads_tools.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_tools.png',
      },
      {
        number: 3,
        title: 'Access Account Access',
        description: 'Under "Setup", click on "Account access" to manage who can access your account.',
        screenshotRef: 'google_ads_account_access.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_account_access.png',
      },
      {
        number: 4,
        title: 'Add the Agency User',
        description: `Click the blue "+" button and enter the agency's email address: ${data.agencyIdentity.email}. Select their access level as: ${getAccessLevelDescription(data.accessLevel)}.`,
        screenshotRef: 'google_ads_add_user.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_add_user.png',
      },
      {
        number: 5,
        title: 'Select Account Access Level',
        description: 'Choose whether the agency should have access to this account only or all accounts in your manager account.',
        screenshotRef: 'google_ads_access_level.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_access_level.png',
      },
      {
        number: 6,
        title: 'Send Invitation',
        description: 'Review the access settings and click "Send invitation" to grant access to the agency.',
        screenshotRef: 'google_ads_send_invitation.png',
        screenshotUrl: '/instructions/screenshots/google-ads/google_ads_send_invitation.png',
      },
    ],
    additionalNotes: [
      'The agency will receive an email invitation to access your account.',
      'They must accept the invitation before they can manage your ads.',
      'You can revoke access anytime from the Account access page.',
    ],
  }),

  ga4: (data) => ({
    steps: [
      {
        number: 1,
        title: 'Open Google Analytics',
        description: 'Navigate to https://analytics.google.com and click "Admin" in the bottom left corner.',
        screenshotRef: 'ga4_admin.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_admin.png',
      },
      {
        number: 2,
        title: 'Select Property',
        description: 'In the "Account" column, select the account that contains the property you want to share.',
        screenshotRef: 'ga4_select_account.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_select_account.png',
      },
      {
        number: 3,
        title: 'Access User Management',
        description: 'In the "Property" column, click on "User Management" under "Property".',
        screenshotRef: 'ga4_user_management.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_user_management.png',
      },
      {
        number: 4,
        title: 'Add the Agency User',
        description: `Click the blue "+" icon in the top right corner and enter the agency's email: ${data.agencyIdentity.email}.`,
        screenshotRef: 'ga4_add_user.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_add_user.png',
      },
      {
        number: 5,
        title: 'Configure Permissions',
        description: `Select "Manage users" or "Edit" permission based on the required access level: ${getAccessLevelDescription(data.accessLevel)}.`,
        screenshotRef: 'ga4_permissions.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_permissions.png',
      },
      {
        number: 6,
        title: 'Send Invitation',
        description: 'Click "Add" to send the invitation. The agency will receive an email to accept access.',
        screenshotRef: 'ga4_send_invitation.png',
        screenshotUrl: '/instructions/screenshots/ga4/ga4_send_invitation.png',
      },
    ],
    additionalNotes: [
      'Make sure to grant access at the Property level, not Account level.',
      'The agency will need to accept the email invitation.',
      'Consider setting up data filters for the agency to view specific segments.',
    ],
  }),
};

/**
 * Get human-readable description for access level
 */
export function getAccessLevelDescription(accessLevel: AccessLevel): string {
  const descriptions: Record<AccessLevel, string> = {
    admin: 'Full management access including create, edit, delete, and manage users',
    standard: 'Can create and manage campaigns, ads, and view reports',
    read_only: 'View-only access to reports and account data',
    email_only: 'Receive email reports and notifications only',
  };

  return descriptions[accessLevel] || accessLevel;
}

/**
 * Generate platform-specific authorization instructions
 *
 * @param input - Instruction generation parameters
 * @returns Platform instructions with steps and notes
 */
export function generateInstructions(input: GenerateInstructionsInput): {
  data?: PlatformInstructions;
  error?: { code: string; message: string };
} {
  try {
    const template = INSTRUCTION_TEMPLATES[input.platform];

    if (!template) {
      return {
        data: null,
        error: {
          code: 'UNSUPPORTED_PLATFORM',
          message: `Instructions not available for platform: ${input.platform}`,
        },
      };
    }

    const instructions = template(input);

    return {
      data: {
        platform: input.platform,
        platformName: input.platformName,
        agencyIdentity: input.agencyIdentity,
        accessLevel: input.accessLevel,
        ...instructions,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate instructions',
        details: String(error),
      },
    };
  }
}

/**
 * Instruction Generation Service
 * Exports all instruction generation functions
 */
export const instructionGenerationService = {
  generateInstructions,
  getAccessLevelDescription,
};
