const DEFAULT_APP_URL = 'https://authhub.co';

export function getCanonicalAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
}

export function buildInviteUrl(uniqueToken: string): string {
  return `${getCanonicalAppUrl()}/invite/${uniqueToken}`;
}

export function buildAuthorizeUrl(uniqueToken: string): string {
  return `${getCanonicalAppUrl()}/authorize/${uniqueToken}`;
}
