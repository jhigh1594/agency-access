/**
 * TypeScript declarations for Vercel Analytics.
 * These packages provide their own types via package.json exports.
 */
declare module '@vercel/analytics/next' {
  export interface AnalyticsProps {
    mode?: 'auto' | 'manual' | 'development';
    debug?: boolean;
    beforeNavigation?: (url: string) => void;
  }
  export function Analytics(props?: AnalyticsProps): React.JSX.Element;
}

export {};

