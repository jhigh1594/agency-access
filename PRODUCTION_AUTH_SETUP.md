# Production Authentication Setup

## Critical: Clerk JWT Verification

The dashboard endpoint currently uses **unverified JWT decoding** for development. This must be fixed before production deployment.

### The Problem

1. **Clerk uses RS256**: Clerk JWTs are signed with RSA asymmetric encryption
2. **Fastify JWT defaults to HS256**: Symmetric encryption with a shared secret
3. **Current workaround**: We decode the JWT without verifying the signature (SECURITY RISK)

### Why This Matters

```typescript
// ❌ CURRENT (DEVELOPMENT ONLY) - Unsafe for production
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
clerkUserId = payload.sub; // No signature verification!

// ✅ PRODUCTION - Must verify the signature
const decoded = await verifyClerkJWT(token);
clerkUserId = decoded.sub; // Signature verified
```

**Without verification, anyone could forge a JWT and impersonate any user!**

---

## Solution Options

### Option 1: Use Clerk Backend SDK (Recommended)

Install the official Clerk backend SDK:

```bash
npm install @clerk/backend
```

**Update `apps/api/src/lib/clerk.ts`:**

```typescript
import { ClerkExpressRequireAuth } from '@clerk/backend';
import { createClerkClient } from '@clerk/backend';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Verify JWT and return the user
export async function verifyClerkToken(token: string) {
  try {
    const jwt = await clerkClient.verifyToken(token);
    return jwt.payload.sub;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

**Update `apps/api/src/routes/dashboard.ts`:**

```typescript
import { verifyClerkToken } from '../lib/clerk.js';

// Replace the JWT decode logic with:
const clerkUserId = await verifyClerkToken(token);
```

**Pros:**
- Official Clerk solution
- Handles RS256 verification automatically
- Maintains compatibility with Clerk's updates
- Easy to use

**Cons:**
- Additional dependency
- Slightly more complex setup

---

### Option 2: Use Fastify JWKS for RS256

Configure Fastify JWT to fetch and use Clerk's public keys:

**Install dependencies:**

```bash
npm install fastify-jwks
```

**Update `apps/api/src/index.ts`:**

```typescript
import fp from 'fastify-plugin';
import { buildClerkProps } from '@clerk/fastify';

// Replace the existing JWT registration with:
await fastify.register(jwt, {
  secret: {
    async getSecretKey(request, rawJwtToken) {
      // Fetch Clerk's JWKS (public keys)
      const response = await fetch('https://flying-molly-28.clerk.accounts.dev/.well-known/jwks.json');
      const jwks = await response.json();

      // Get the key ID from the JWT header
      const header = JSON.parse(Buffer.from(rawJwtToken.split('.')[0], 'base64').toString());
      const keyId = header.kid;

      // Find the matching public key
      const key = jwks.keys.find(k => k.kid === keyId);
      if (!key) {
        throw new Error('Key not found');
      }

      // Convert to PEM format
      return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
    }
  }
});
```

**Pros:**
- No additional SDK dependencies
- Uses Fastify's built-in JWT
- Standard RS256 verification

**Cons:**
- More manual setup
- Need to handle JWKS caching
- PEM conversion complexity

---

### Option 3: Hybrid Approach (Current + Verification)

Keep the current flexible approach but add verification:

**Update `apps/api/src/routes/dashboard.ts`:**

```typescript
// Add this function at the top of the file
async function verifyClerkJwt(fastify: FastifyInstance, token: string): Promise<string> {
  // Check if CLERK_SECRET_KEY is set
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not configured');
  }

  // Try to decode with verification
  try {
    const decoded = fastify.jwt.verify(token) as any;
    if (decoded.sub) {
      return decoded.sub;
    }
  } catch (error) {
    // Verification failed - this is expected for RS256 tokens
    // Fall through to Clerk SDK verification
  }

  // If fastify.jwt.verify failed (likely RS256), use Clerk SDK
  const { createClerkClient } = await import('@clerk/backend');
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  const jwt = await clerkClient.verifyToken(token);
  return jwt.payload.sub;
}
```

**Then replace the JWT decode logic with:**

```typescript
clerkUserId = await verifyClerkJwt(fastify, token);
```

**Pros:**
- Graceful fallback
- Works with both test tokens (HS256) and production tokens (RS256)
- Clear error if not configured

**Cons:**
- More complex
- Two verification attempts

---

## Recommended Implementation

**I recommend Option 1 (Clerk Backend SDK)** because:

1. It's the official solution
2. It's maintained by Clerk
3. It handles edge cases
4. It's future-proof

### Implementation Steps

1. **Install the SDK:**
   ```bash
   npm install @clerk/backend
   ```

2. **Create `apps/api/src/lib/clerk.ts`:**
   ```typescript
   import { createClerkClient } from '@clerk/backend';

   export const clerkClient = createClerkClient({
     secretKey: process.env.CLERK_SECRET_KEY,
   });

   export async function verifyClerkToken(token: string): Promise<string> {
     try {
       const jwt = await clerkClient.verifyToken(token);
       return jwt.payload.sub;
     } catch (error) {
       throw new Error('Invalid authentication token');
     }
   }
   ```

3. **Update `apps/api/src/routes/dashboard.ts`:**
   - Import: `import { verifyClerkToken } from '../lib/clerk.js';`
   - Replace the JWT decode section (lines 32-57) with:
     ```typescript
     // Decode and verify JWT to get clerkUserId
     if (!clerkUserId) {
       const token = request.headers['x-agency-id'] as string;
       if (token) {
         // Check if it looks like a JWT
         if (token.split('.').length === 3) {
           try {
             clerkUserId = await verifyClerkToken(token);
           } catch (error) {
             return reply.code(401).send({
               data: null,
               error: {
                 code: 'INVALID_TOKEN',
                 message: 'Invalid authentication token',
               },
             });
           }
         } else {
           // Not a JWT format, treat as raw user ID
           clerkUserId = token;
         }
       }
     }
     ```

4. **Set environment variable in production:**
   ```bash
   CLERK_SECRET_KEY=sk_live_xxxxx  # Your production secret key
   ```

---

## Environment Variables Checklist

### Required for Production

```bash
# Core
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...  # Production Neon DB
FRONTEND_URL=https://authhub.co  # Production frontend URL
API_URL=https://api.authhub.co  # Production API URL

# Clerk Authentication (REQUIRED)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx  # CRITICAL: Must be set for JWT verification

# Infisical (Secrets Management)
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
INFISICAL_ENVIRONMENT=prod

# Redis
REDIS_URL=redis://...  # Production Upstash Redis

# Meta OAuth
META_APP_ID=...
META_APP_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Notifications
RESEND_API_KEY=...  # For production emails
```

### Optional (Feature-Specific)

```bash
# Kit (ConvertKit) - Only if using Kit platform
KIT_CLIENT_ID=...
KIT_CLIENT_SECRET=...

# Beehiiv - Only if using Beehiiv platform
BEEHIIV_API_KEY=...

# Google Ads Developer Token
GOOGLE_ADS_DEVELOPER_TOKEN=...
```

---

## Testing Before Production

### 1. Test JWT Verification Locally

```bash
# Set up your .env.local with test credentials
CLERK_SECRET_KEY=sk_test_xxxxx

# Start the server
npm run dev:api

# Test with a real Clerk JWT from your frontend
curl -X GET http://localhost:3001/api/dashboard \
  -H "x-agency-id: YOUR_CLERK_JWT_TOKEN"
```

### 2. Verify Token Extraction

Create a test script `scripts/test-jwt.ts`:

```typescript
import { verifyClerkToken } from '../apps/api/src/lib/clerk.js';

const testToken = 'YOUR_CLERK_JWT'; // Get from browser devtools

console.log('Testing JWT verification...');
const userId = await verifyClerkToken(testToken);
console.log('User ID:', userId);
console.log('✅ JWT verification works!');
```

Run with: `npx tsx scripts/test-jwt.ts`

### 3. Test in Production-like Environment

```bash
# Build the application
npm run build

# Start with production env vars
NODE_ENV=production CLERK_SECRET_KEY=sk_live_xxx npm run start:api

# Verify the dashboard loads
curl https://api.authhub.co/api/dashboard \
  -H "x-agency-id: PRODUCTION_JWT_TOKEN"
```

---

## Security Checklist

Before deploying to production:

- [ ] CLERK_SECRET_KEY is set to production value (starts with `sk_live_`)
- [ ] JWT verification is implemented and tested
- [ ] All unverified JWT decode paths are removed
- [ ] Database connection uses SSL (`?sslmode=require` in DATABASE_URL)
- [ ] Redis connection uses TLS (`rediss://` protocol)
- [ ] Infisical credentials are rotated
- [ ] CORS origins are set to production domains only
- [ ] Logging level is set to `info` or `warn`
- [ ] Rate limiting is configured (if applicable)
- [ ] All development/debug endpoints are disabled

---

## Deployment Notes

### Vercel (Frontend)

```bash
# Set environment variables in Vercel dashboard:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_API_URL=https://api.authhub.co
```

### Railway (Backend)

```bash
# Set environment variables in Railway dashboard:
CLERK_SECRET_KEY=sk_live_xxx  # CRITICAL
DATABASE_URL=postgresql://...?sslmode=require
REDIS_URL=rediss://...
# ... other vars
```

---

## Monitoring After Deployment

1. **Check dashboard loads** with real user JWT
2. **Verify token extraction** works (check server logs)
3. **Test agency resolution** returns correct agency
4. **Monitor error rates** for INVALID_TOKEN errors
5. **Set up alerts** for authentication failures

---

## Need Help?

If you encounter issues:

1. **Clerk docs**: https://clerk.com/docs/backend-requests/handling/manual-jwt
2. **Fastify JWT**: https://github.com/fastify/fastify-jwt
3. **Check token format**: Use https://jwt.io to inspect your JWT structure
4. **Verify Clerk secret**: Make sure you're using the correct secret key for your instance

---

## Quick Reference: Common Issues

| Issue | Cause | Solution |
|-------|--------|----------|
| `INVALID_TOKEN` | CLERK_SECRET_KEY not set | Add to environment variables |
| `INVALID_TOKEN` | Using test secret in prod | Use `sk_live_` key |
| `AGENCY_NOT_FOUND` | Wrong user ID extracted | Check JWT `sub` claim |
| Token decode fails | RS256 vs HS256 mismatch | Use Clerk Backend SDK |
| CORS errors | Wrong origin | Update allowed origins list |
