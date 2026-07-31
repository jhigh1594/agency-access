import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const AUTHHUB_DIR = path.join(os.homedir(), '.authhub');
const CREDENTIALS_FILE = path.join(AUTHHUB_DIR, 'credentials.json');

export interface AuthHubCredentials {
  accessToken: string;
  agencyId: string;
  grantId: string;
  permissions: string[];
  displayName: string;
  apiBaseUrl: string;
  savedAt: string;
}

export function getCredentialsDir(): string {
  return AUTHHUB_DIR;
}

export function loadCredentials(): AuthHubCredentials | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(raw) as AuthHubCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: AuthHubCredentials): void {
  if (!fs.existsSync(AUTHHUB_DIR)) {
    fs.mkdirSync(AUTHHUB_DIR, { recursive: true });
  }
  credentials.savedAt = new Date().toISOString();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf-8');
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
}

export function clearCredentials(): void {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}
