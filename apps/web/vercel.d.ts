/**
 * TypeScript declarations for Vercel Analytics and Speed Insights.
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

declare module '@vercel/speed-insights/next' {
  export interface SpeedInsightsProps {
    debug?: boolean;
    route?: string;
    params?: Record<string, string>;
  }
  export function SpeedInsights(props?: SpeedInsightsProps): React.JSX.Element;
}

export {};
