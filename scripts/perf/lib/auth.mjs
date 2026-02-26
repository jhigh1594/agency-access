import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/backend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

function loadApiEnv() {
  dotenv.config({ path: path.join(repoRoot, 'apps/api/.env') });
}

export async function createPerfSessionToken() {
  loadApiEnv();

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is required in apps/api/.env');
  }

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  const preferredUserId = process.env.PERF_USER_ID;
  let userId = preferredUserId;

  if (!userId) {
    const users = await clerk.users.getUserList({ limit: 1 });
    if (users.data.length === 0) {
      throw new Error('No Clerk users found. Set PERF_USER_ID to a valid Clerk user id.');
    }
    userId = users.data[0].id;
  }

  const session = await clerk.sessions.createSession({ userId });

  const tokenResponse = await fetch(`https://api.clerk.com/v1/sessions/${session.id}/tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`Failed to mint Clerk session token: ${tokenResponse.status} ${details}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload.jwt) {
    throw new Error('Clerk token endpoint returned no jwt field.');
  }

  return {
    userId,
    sessionId: session.id,
    token: tokenPayload.jwt,
  };
}
