---
name: secrets-management
description: Secure secrets and token management patterns. Use when handling OAuth tokens, API keys, environment variables, or implementing security features.
---

# Secrets Management

## Core Principles

### Never Store Secrets in Code
- No hardcoded API keys, tokens, or passwords
- No secrets in git history
- No secrets in client-side code

### Never Store Tokens in Database
- Use a secrets manager (Infisical, Vault, AWS Secrets Manager)
- Store only secret references (IDs) in database
- Retrieve secrets only when needed

## Infisical Integration (This Project)

### Storing OAuth Tokens
```typescript
import { infisical } from '@/lib/infisical';

// Generate a unique secret name
const secretName = infisical.generateSecretName('meta', connectionId);

// Store tokens in Infisical
await infisical.storeOAuthTokens(secretName, {
  accessToken: token.access_token,
  refreshToken: token.refresh_token,
  expiresAt: new Date(Date.now() + token.expires_in * 1000),
});

// Store only the secret reference in database
await prisma.platformAuthorization.create({
  data: {
    connectionId,
    platform: 'meta_ads',
    secretId: secretName,  // Only the reference!
  }
});
```

### Retrieving Tokens
```typescript
// Get tokens when needed for API calls
const tokens = await infisical.getOAuthTokens(authorization.secretId);

// Use the token
const response = await fetch(apiUrl, {
  headers: {
    Authorization: `Bearer ${tokens.accessToken}`
  }
});

// Log the access
await prisma.auditLog.create({
  data: {
    agencyId,
    action: 'token_viewed',
    resourceType: 'platform_authorization',
    resourceId: authorization.id,
    userEmail,
    ipAddress,
    userAgent,
  }
});
```

### Deleting Tokens
```typescript
// When revoking access
await infisical.deleteSecret(authorization.secretId);

await prisma.platformAuthorization.update({
  where: { id: authorization.id },
  data: { status: 'revoked', secretId: null }
});
```

## Environment Variables

### Structure
```bash
# .env.example (committed)
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
INFISICAL_CLIENT_ID=
INFISICAL_CLIENT_SECRET=

# .env (never committed)
DATABASE_URL=postgresql://actual-connection-string
CLERK_SECRET_KEY=sk_live_actual_key
```

### Validation with Zod
```typescript
// apps/api/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  INFISICAL_CLIENT_ID: z.string().min(1),
  INFISICAL_CLIENT_SECRET: z.string().min(1),
  INFISICAL_PROJECT_ID: z.string().uuid(),
  INFISICAL_ENVIRONMENT: z.enum(['dev', 'staging', 'prod']),
});

export const env = envSchema.parse(process.env);
```

### Client-Side Variables
```typescript
// Only NEXT_PUBLIC_ variables are exposed to browser
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001

// Never expose:
// - Secret keys
// - Database URLs
// - API secrets
```

## Audit Logging

### Required for All Token Access
```typescript
interface AuditLogEntry {
  agencyId: string;
  action: 'token_viewed' | 'access_granted' | 'access_revoked' | 
          'AGENCY_CONNECTED' | 'AGENCY_DISCONNECTED' | 'AGENCY_TOKEN_REFRESHED';
  resourceType: string;
  resourceId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}
```

### Implementation
```typescript
async function logTokenAccess(
  req: FastifyRequest,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      agencyId: req.user.agencyId,
      action,
      resourceType,
      resourceId,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata,
    }
  });
}
```

## OAuth Security

### CSRF Protection
```typescript
// Generate state token
const state = await oauthStateService.createState({
  agencyId,
  platform,
  redirectUri,
});

// Store in Redis with TTL
await redis.setex(`oauth:state:${state}`, 600, JSON.stringify(data));

// Validate on callback
const storedState = await oauthStateService.validateState(state);
if (!storedState) {
  throw new Error('Invalid or expired OAuth state');
}
```

### Token Refresh
```typescript
// Schedule refresh before expiration
const refreshAt = new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 min before

await tokenRefreshQueue.add('refresh-token', {
  authorizationId: authorization.id,
}, {
  delay: refreshAt.getTime() - Date.now(),
});
```

## Security Checklist

- [ ] No secrets in code or git history
- [ ] Environment variables validated at startup
- [ ] Tokens stored in Infisical, not database
- [ ] All token access logged in AuditLog
- [ ] OAuth state tokens use Redis with TTL
- [ ] Token refresh scheduled before expiration
- [ ] Client-side has no access to secrets
- [ ] .env files in .gitignore
