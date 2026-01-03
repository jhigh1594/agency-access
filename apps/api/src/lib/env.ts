import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  // Backend API URL (for OAuth callbacks, defaults to localhost with PORT if not set)
  API_URL: z.string().url().default(`http://localhost:${process.env.PORT || 3001}`),

  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),

  // Infisical (Secrets Management)
  INFISICAL_CLIENT_ID: z.string(),
  INFISICAL_CLIENT_SECRET: z.string(),
  INFISICAL_PROJECT_ID: z.string(),
  INFISICAL_ENVIRONMENT: z.string().default('dev'),

  // Redis (Upstash)
  REDIS_URL: z.string().url(),

  // Meta OAuth
  META_APP_ID: z.string(),
  META_APP_SECRET: z.string(),

  // Kit (ConvertKit) OAuth
  KIT_CLIENT_ID: z.string().optional(),
  KIT_CLIENT_SECRET: z.string().optional(),

  // Beehiiv API (Agency's API key for team access)
  BEEHIIV_API_KEY: z.string().optional(),

  // Google OAuth (unified - covers all Google products)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Legacy: Google Ads-specific credentials (optional, for API access)
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  
  // Notifications
  RESEND_API_KEY: z.string().optional(),

  LOG_LEVEL: z.string().default('info'),
});

const parsedEnv = envSchema.parse(process.env);

// Parse Redis URL into components for IORedis
const redisUrl = new URL(parsedEnv.REDIS_URL);

export const env = {
  ...parsedEnv,
  REDIS_HOST: redisUrl.hostname,
  REDIS_PORT: parseInt(redisUrl.port || '6379', 10),
  REDIS_PASSWORD: redisUrl.password || undefined,
};
