/**
 * Test Routes for Sentry Integration
 *
 * These routes are for testing error monitoring and webhook integrations.
 * Remove in production or secure behind authentication.
 */

import { FastifyInstance } from 'fastify';

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
    await new Promise((resolve) => {
      // @ts-expect-error - Intentional error for testing
      setTimeout(() => {
        // @ts-expect-error - Intentional error for testing
        nonExistentObject.property.value = 'test';
        resolve(undefined);
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
    const fs = await import('fs/promises');
    const path = await import('path');

    const tasksDir = path.join(process.cwd(), '.claude/tasks/sentry-issues');

    let taskFiles = [];
    try {
      taskFiles = await fs.readdir(tasksDir);
      taskFiles = taskFiles.filter(f => f.endsWith('.md')).sort((a, b) =>
        fs.statSync(path.join(tasksDir, a)).mtimeMs -
        fs.statSync(path.join(tasksDir, b)).mtimeMs
      );
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
