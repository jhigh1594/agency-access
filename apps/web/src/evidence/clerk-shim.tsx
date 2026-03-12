export function useAuth() {
  return {
    userId: 'user_evidence_123',
    orgId: 'agency-evidence',
    isLoaded: true,
    getToken: async () => 'mock-token',
  };
}

export function useUser() {
  return {
    user: {
      primaryEmailAddress: { emailAddress: 'owner@agency.com' },
      emailAddresses: [{ emailAddress: 'owner@agency.com' }],
    },
  };
}
