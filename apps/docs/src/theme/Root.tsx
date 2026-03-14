import React, { useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';

type PostHogClient = {
  init: (apiKey: string, options: Record<string, unknown>) => void;
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
};

export default function Root({ children }: PropsWithChildren): React.JSX.Element {
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();
  const posthogRef = useRef<PostHogClient | null>(null);
  const lastSearchValueRef = useRef('');
  const [analyticsReady, setAnalyticsReady] = useState(false);

  const posthogKey =
    typeof siteConfig.customFields?.posthogKey === 'string'
      ? siteConfig.customFields.posthogKey
      : '';
  const posthogHost =
    typeof siteConfig.customFields?.posthogHost === 'string'
      ? siteConfig.customFields.posthogHost
      : 'https://us.i.posthog.com';
  const sendPosthogInDev =
    siteConfig.customFields?.sendPosthogInDev === 'true';

  useEffect(() => {
    if (!posthogKey || typeof window === 'undefined') {
      return;
    }

    const host = window.location.hostname;
    const isLocalhost = host.includes('127.0.0.1') || host.includes('localhost');
    if (process.env.NODE_ENV === 'development' && isLocalhost && !sendPosthogInDev) {
      return;
    }

    let isCancelled = false;

    async function initAnalytics() {
      const { default: posthog } = await import('posthog-js');
      if (isCancelled) {
        return;
      }

      posthog.init(posthogKey, {
        api_host: posthogHost,
        ui_host: 'https://us.posthog.com',
        persistence: 'localStorage',
        capture_pageview: false,
        capture_pageleave: true,
        debug: process.env.NODE_ENV === 'development',
      });

      posthogRef.current = posthog as PostHogClient;
      setAnalyticsReady(true);
    }

    void initAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [posthogHost, posthogKey, sendPosthogInDev]);

  useEffect(() => {
    if (!analyticsReady || !posthogRef.current || typeof document === 'undefined') {
      return;
    }

    posthogRef.current.capture('docs_page_viewed', {
      pathname: location.pathname,
      search: location.search,
      title: document.title,
    });
  }, [analyticsReady, location.pathname, location.search]);

  useEffect(() => {
    if (!analyticsReady || !posthogRef.current || typeof document === 'undefined') {
      return;
    }

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>('[data-docs-cta]');

      if (!cta) {
        return;
      }

      posthogRef.current?.capture('docs_cta_clicked', {
        cta: cta.dataset.docsCta || 'unknown',
        pathname: location.pathname,
      });
    };

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target || target.tagName !== 'INPUT' || target.type !== 'search') {
        return;
      }

      const value = target.value.trim();
      if (value.length < 2 || value === lastSearchValueRef.current) {
        return;
      }

      lastSearchValueRef.current = value;
      posthogRef.current?.capture('docs_search_used', {
        pathname: location.pathname,
        queryLength: value.length,
      });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('input', handleInput);
    };
  }, [analyticsReady, location.pathname]);

  return <>{children}</>;
}
