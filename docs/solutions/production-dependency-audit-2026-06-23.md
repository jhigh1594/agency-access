# Production Dependency Audit - 2026-06-23

## Shipping Runtime Workspaces

Command:

```bash
npm audit --omit=dev --audit-level=moderate --workspace=apps/api --workspace=apps/web
```

Result:

```text
found 0 vulnerabilities
```

The production API and web app dependency trees were remediated by upgrading the direct runtime dependencies that pulled the vulnerable chains:

- Clerk Next.js/backend packages
- Next.js
- Fastify and Fastify JWT
- Infisical SDK
- Sentry packages
- OpenTelemetry packages
- PostHog
- Resend/Svix
- PostCSS and Picomatch transitive placement

The web blog loader no longer uses `gray-matter`; checked-in Markdown frontmatter is parsed with `yaml` to remove the vulnerable `gray-matter -> js-yaml@3` runtime path from `apps/web`.

## Monorepo Tooling Advisory

Command:

```bash
npm audit --omit=dev --audit-level=moderate --workspaces
```

Remaining advisories are isolated to `apps/docs` / Docusaurus build tooling:

- `@docusaurus/* -> gray-matter -> js-yaml`
- `@docusaurus/bundler -> copy-webpack-plugin/css-minimizer-webpack-plugin -> serialize-javascript`
- `webpack-dev-server -> sockjs -> uuid`

These packages are not in the shipping `apps/api` or `apps/web` production runtime audit. Treat them as docs-tooling debt, not customer-facing launch blockers, unless the Docusaurus docs app is deployed as part of the production surface.
