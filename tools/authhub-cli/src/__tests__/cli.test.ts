import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError, outputJson } from '../errors.js';
import { getApiBaseUrl } from '../api-client.js';

const mockStderrWrite = vi.fn(() => true);
const mockStdoutWrite = vi.fn(() => true);
const mockExit = vi.fn((_code?: number) => {});

describe('errors - handleError', () => {
  let stderrOutput: string[];
  let exitCode: number;

  beforeEach(() => {
    stderrOutput = [];
    exitCode = 0;
    mockStderrWrite.mockClear();
    mockExit.mockClear();
  });

  it('writes structured error JSON to stderr and exits with code 1', () => {
    mockStderrWrite.mockImplementation((data: string) => {
      stderrOutput.push(data);
      return true;
    });
    mockExit.mockImplementation((code: number) => {
      exitCode = code;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(mockStderrWrite);
    vi.spyOn(process, 'exit').mockImplementation(mockExit);

    try {
      handleError(new Error('test error'));
    } catch {
      // process.exit mock does not throw
    }

    expect(stderrOutput.length).toBe(1);
    const parsed = JSON.parse(stderrOutput[0]);
    expect(parsed.error.code).toBe('UNKNOWN_ERROR');
    expect(parsed.error.message).toBe('test error');
    expect(parsed.error.status).toBe(1);
    expect(exitCode).toBe(1);
  });

  it('preserves augmented error fields', () => {
    mockStderrWrite.mockImplementation((data: string) => {
      stderrOutput.push(data);
      return true;
    });
    mockExit.mockImplementation((code: number) => {
      exitCode = code;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(mockStderrWrite);
    vi.spyOn(process, 'exit').mockImplementation(mockExit);

    const err = new Error('rate limited') as Error & { code: string; status: number; retryable: boolean; retryAfterSeconds: number };
    err.code = 'RATE_LIMITED';
    err.status = 429;
    err.retryable = true;
    err.retryAfterSeconds = 30;

    try {
      handleError(err);
    } catch {
      // process.exit mock does not throw
    }

    const parsed = JSON.parse(stderrOutput[0]);
    expect(parsed.error.code).toBe('RATE_LIMITED');
    expect(parsed.error.status).toBe(429);
    expect(parsed.error.retryable).toBe(true);
    expect(parsed.error.retryAfterSeconds).toBe(30);
  });

  it('uses default exit code 1 when status is missing', () => {
    mockStderrWrite.mockImplementation(() => true);
    mockExit.mockImplementation((code: number) => {
      exitCode = code;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation(mockStderrWrite);
    vi.spyOn(process, 'exit').mockImplementation(mockExit);

    try {
      handleError(new Error('plain'));
    } catch {
      // process.exit mock does not throw
    }

    expect(exitCode).toBe(1);
  });
});

describe('errors - outputJson', () => {
  let stdoutOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];
    mockStdoutWrite.mockClear();
  });

  it('writes compact JSON to stdout', () => {
    mockStdoutWrite.mockImplementation((data: string) => {
      stdoutOutput.push(data);
      return true;
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(mockStdoutWrite);

    outputJson({ foo: 'bar' });
    expect(stdoutOutput.length).toBe(1);
    expect(JSON.parse(stdoutOutput[0])).toEqual({ foo: 'bar' });
    expect(stdoutOutput[0]).not.toContain('\n  ');
  });

  it('writes pretty-printed JSON when requested', () => {
    mockStdoutWrite.mockImplementation((data: string) => {
      stdoutOutput.push(data);
      return true;
    });
    vi.spyOn(process.stdout, 'write').mockImplementation(mockStdoutWrite);

    outputJson({ nested: { a: 1, b: 2 } }, true);
    expect(stdoutOutput[0]).toContain('\n');
    expect(stdoutOutput[0]).toContain('  ');
    expect(JSON.parse(stdoutOutput[0])).toEqual({ nested: { a: 1, b: 2 } });
  });
});

describe('api-client - getApiBaseUrl', () => {
  const originalEnv = process.env.AUTHHUB_API_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AUTHHUB_API_URL;
    } else {
      process.env.AUTHHUB_API_URL = originalEnv;
    }
  });

  it('returns AUTHHUB_API_URL from env when set', () => {
    process.env.AUTHHUB_API_URL = 'https://api.authhub.co';
    expect(getApiBaseUrl()).toBe('https://api.authhub.co');
  });

  it('defaults to localhost:3001', () => {
    delete process.env.AUTHHUB_API_URL;
    expect(getApiBaseUrl()).toBe('http://localhost:3001');
  });
});
