/**
 * Test Routes for Sentry Integration
 *
 * These routes are for testing error monitoring and webhook integrations.
 * Remove in production or secure behind authentication.
 */

import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';

export async function sentryTestRoutes(fastify: FastifyInstance) {
  /**
   * GET /test/sentry/error
   *
   * Intentionally throws an error to test Sentry integration.
   * This will trigger a Sentry event which should create a webhook alert
   * that generates a task file in .claude/tasks/sentry-issues/
   */
  fastify.get('/test/sentry/error', async () => {
    // Call an undefined function to trigger a ReferenceError
    // @ts-expect-error - Intentional error for testing
    myUndefinedFunction();
    return { message: 'This should never be reached' };
  });

  /**
   * GET /test/sentry/async-error
   *
   * Test async error handling
   */
  fastify.get('/test/sentry/async-error', async () => {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        // @ts-expect-error - Intentional error for testing
        nonExistentObject.property.value = 'test';
        resolve();
      }, 100);
    });
    return { message: 'This should never be reached' };
  });

  /**
   * GET /test/sentry/webhook
   *
   * Test the Sentry webhook endpoint directly without going through Sentry
   * Returns a mock Sentry webhook payload
   */
  fastify.get('/test/sentry/webhook', async () => {
    return {
      message: 'Use POST to test webhook',
      example: {
        action: 'created',
        data: {
          issue: {
            id: 'test-' + Date.now(),
            shortId: 'TEST-' + Math.floor(Math.random() * 10000),
            title: 'Test Issue from API',
            level: 'error',
            type: 'error',
            culprit: 'testFunction',
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            count: 1,
            permalink: 'https://sentry.io/test',
            metadata: {
              filename: 'test.js',
              lineno: 42,
              function: 'myUndefinedFunction'
            },
            tags: [
              { key: 'environment', value: process.env.NODE_ENV || 'development' },
              { key: 'test', value: 'true' }
            ],
            stacktrace: {
              frames: [
                {
                  filename: '/test/path.js',
                  lineno: 42,
                  function: 'myUndefinedFunction',
                  inApp: true
                }
              ]
            }
          },
          event: {
            eventID: 'evt-' + Date.now(),
            receivedAt: new Date().toISOString(),
            tags: [],
            contexts: {},
            request: {
              url: 'http://localhost:3001/api/test/sentry/error',
              method: 'GET'
            },
            user: {
              id: 'test-user-123',
              email: 'test@example.com'
            },
            breadcrumbs: [
              {
                category: 'test',
                message: 'Test breadcrumb',
                level: 'info',
                timestamp: new Date().toISOString()
              }
            ]
          },
          trigger: {
            type: 'new_issue',
            label: 'New Issue'
          }
        }
      }
    };
  });

  /**
   * GET /test/sentry/health
   *
   * Check if Sentry webhook integration is working
   */
  fastify.get('/test/sentry/health', async () => {
    const tasksDir = path.join(process.cwd(), '.claude/tasks/sentry-issues');

    let taskFiles: string[] = [];
    try {
      taskFiles = await fs.readdir(tasksDir);
      // Filter for markdown files and sort by modification time
      const mdFiles = taskFiles.filter(f => f.endsWith('.md'));

      // Get file stats and sort
      const filesWithStats = await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = path.join(tasksDir, file);
          const stat = await fs.stat(filePath);
          return { file, mtimeMs: stat.mtimeMs };
        })
      );

      filesWithStats.sort((a, b) => a.mtimeMs - b.mtimeMs);
      taskFiles = filesWithStats.map(f => f.file);
    } catch {
      // Directory doesn't exist yet
    }

    return {
      integration: 'sentry-webhook',
      status: 'active',
      tasksDirectory: tasksDir,
      taskFileCount: taskFiles.length,
      recentTaskFiles: taskFiles.slice(-5),
      timestamp: new Date().toISOString()
    };
  });
}
