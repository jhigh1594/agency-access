export interface StructuredError {
  code: string;
  message: string;
  status: number;
  retryable?: boolean;
  retryAfterSeconds?: number;
  details?: unknown;
}

export function handleError(error: unknown): never {
  const err = error as Error & Partial<StructuredError>;

  const structured: StructuredError = {
    code: err.code || 'UNKNOWN_ERROR',
    message: err.message || 'An unknown error occurred',
    status: err.status || 1,
    retryable: err.retryable ?? false,
    retryAfterSeconds: err.retryAfterSeconds,
    details: err.details,
  };

  process.stderr.write(JSON.stringify({ error: structured }, null, 2) + '\n');
  process.exit(err.status && err.status >= 1 ? Math.min(err.status, 127) : 1);
}

export function outputJson(data: unknown, pretty?: boolean): void {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  process.stdout.write(json + '\n');
}

export function outputText(lines: string[]): void {
  process.stdout.write(lines.join('\n') + '\n');
}
