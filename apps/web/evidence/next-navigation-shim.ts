export function useRouter() {
  return {
    push: () => undefined,
    replace: () => undefined,
    prefetch: async () => undefined,
    refresh: () => undefined,
    back: () => undefined,
    forward: () => undefined,
  };
}

export function usePathname() {
  return window.location.pathname;
}

export function useParams() {
  return {};
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function useSelectedLayoutSegment() {
  return null;
}

export function useSelectedLayoutSegments() {
  return [];
}

export const RedirectType = {
  push: 'push',
  replace: 'replace',
} as const;

export function redirect(_href: string, _type?: (typeof RedirectType)[keyof typeof RedirectType]) {
  throw new Error('redirect is not supported in the Vite evidence harness');
}

export function permanentRedirect(_href: string, _type?: (typeof RedirectType)[keyof typeof RedirectType]) {
  throw new Error('permanentRedirect is not supported in the Vite evidence harness');
}

export function notFound() {
  throw new Error('notFound is not supported in the Vite evidence harness');
}
