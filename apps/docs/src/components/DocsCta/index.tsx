import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

function toUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

export default function DocsCta(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const productSiteUrl =
    typeof siteConfig.customFields?.productSiteUrl === 'string'
      ? siteConfig.customFields.productSiteUrl
      : 'https://www.authhub.co';

  return (
    <div className={styles.ctaShell}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Need a faster path?</span>
        <h2>Move from support docs to a live client request in one session.</h2>
        <p>
          Use the docs to unblock setup, then jump straight into AuthHub to
          send the request, track approvals, and keep onboarding moving.
        </p>
      </div>
      <div className={styles.actions}>
        <a
          href={toUrl(productSiteUrl, '/pricing')}
          className={`${styles.button} ${styles.primary}`}
          data-docs-cta="get_started"
        >
          Get Started
        </a>
        <a
          href={toUrl(productSiteUrl, '/sign-in')}
          className={`${styles.button} ${styles.secondary}`}
          data-docs-cta="sign_in"
        >
          Sign In
        </a>
        <a
          href={toUrl(productSiteUrl, '/contact')}
          className={styles.supportLink}
          data-docs-cta="contact_support"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
