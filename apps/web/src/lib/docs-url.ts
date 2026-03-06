const DEFAULT_DOCS_URL = 'https://docs.authhub.com';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizePath(path: string): string {
  if (!path) {
    return '';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function getDocsUrl(path = ''): string {
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_DOCS_URL || DEFAULT_DOCS_URL,
  );

  return `${baseUrl}${normalizePath(path)}`;
}
