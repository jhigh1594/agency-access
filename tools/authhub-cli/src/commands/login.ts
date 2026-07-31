import { Command } from 'commander';
import { outputJson, handleError, outputText } from '../errors.js';
import { saveCredentials, clearCredentials, loadCredentials } from '../config.js';
import { apiFetch, getApiBaseUrl } from '../api-client.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with AuthHub via OAuth')
    .option('--api-url <url>', 'AuthHub API base URL')
    .option('--token <token>', 'Use an existing agent access token directly')
    .action(async (options) => {
      try {
        if (options.token) {
          await loginWithToken(options.token, options.apiUrl);
          return;
        }

        const apiUrl = options.apiUrl || getApiBaseUrl();
        console.error(`Opening browser for authentication at ${apiUrl}...`);
        console.error('Complete the OAuth flow in your browser, then paste the access token here.');
        console.error('');
        console.error('If agent OAuth is not configured, run `authhub login --token <access_token>` with a Clerk-issued agent access token.');

        const token = await readTokenFromStdin();
        await loginWithToken(token, apiUrl);
      } catch (error) {
        handleError(error);
      }
    });

  program
    .command('logout')
    .description('Clear stored credentials')
    .action(() => {
      clearCredentials();
      outputJson({ status: 'logged_out' });
    });

  program
    .command('whoami')
    .description('Show current authentication status')
    .action(() => {
      const creds = loadCredentials();
      if (!creds) {
        outputJson({ authenticated: false });
        return;
      }
      outputJson({
        authenticated: true,
        agencyId: creds.agencyId,
        grantId: creds.grantId,
        displayName: creds.displayName,
        permissions: creds.permissions,
        apiBaseUrl: creds.apiBaseUrl,
        savedAt: creds.savedAt,
      });
    });
}

async function loginWithToken(token: string, apiUrl?: string): Promise<void> {
  const baseUrl = apiUrl || getApiBaseUrl();
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${url}/api/dashboard`, { headers });

  if (!response.ok) {
    const error = new Error(`Authentication failed: ${response.status}`) as Error & { code: string; status: number };
    error.code = 'AUTH_FAILED';
    error.status = response.status;
    throw error;
  }

  const payload = await response.json() as { data?: { agencyId?: string } };
  const agencyId = payload.data?.agencyId;

  if (!agencyId) {
    const error = new Error('Could not determine agency from authentication response') as Error & { code: string };
    error.code = 'NO_AGENCY';
    throw error;
  }

  const grantInfo = await resolveGrantInfo(token, url);

  saveCredentials({
    accessToken: token,
    agencyId,
    grantId: grantInfo?.grantId || 'direct',
    permissions: grantInfo?.permissions || [],
    displayName: grantInfo?.displayName || 'CLI',
    apiBaseUrl: url,
    savedAt: new Date().toISOString(),
  });

  outputText([`Authenticated as ${grantInfo?.displayName || 'CLI'}`, `Agency: ${agencyId}`, `Run \`authhub whoami\` to verify.`]);
}

async function resolveGrantInfo(token: string, baseUrl: string): Promise<{ grantId?: string; permissions?: string[]; displayName?: string } | null> {
  try {
    const response = await fetch(`${baseUrl}/api/agencies/${''}/agent-grants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: Array<{ id: string; permissions: string[]; displayName: string }> };
    const grants = payload.data;
    if (!grants || grants.length === 0) return null;
    return { grantId: grants[0].id, permissions: grants[0].permissions, displayName: grants[0].displayName };
  } catch {
    return null;
  }
}

function readTokenFromStdin(): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write('Access token: ');
    process.stdin.setEncoding('utf-8');
    process.stdin.resume();
    let input = '';
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      resolve(input.trim());
    });
  });
}
