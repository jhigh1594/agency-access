import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerRequestsCommand(program: Command): void {
  const requests = program.command('requests').description('Manage access requests');

  requests
    .command('list')
    .description('List access requests')
    .option('--status <status>', 'Filter by status')
    .option('--limit <n>', 'Number of results', '25')
    .option('--offset <n>', 'Pagination offset', '0')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const params = new URLSearchParams({ limit: options.limit, offset: options.offset });
        if (options.status) params.set('status', options.status);
        const data = await apiFetch(`/api/agencies/${agencyId}/access-requests?${params}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  requests
    .command('get <id>')
    .description('Get access request details')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/access-requests/${id}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  requests
    .command('prepare')
    .description('Prepare an access request (requires approval)')
    .requiredOption('--client-id <id>', 'Client ID')
    .requiredOption('--platforms <platforms>', 'Comma-separated platforms (e.g. google_ads,meta_ads)')
    .option('--template-id <id>', 'Template ID')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const platforms = options.platforms.split(',').map((p: string) => p.trim());
        const body: Record<string, unknown> = {
          clientId: options.clientId,
          platforms: platforms.map((p: string) => ({ platform: p, accessLevel: 'manage' as const })),
          idempotencyKey: options.idempotencyKey,
        };
        if (options.templateId) body.templateId = options.templateId;

        const data = await apiFetch('/api/access-requests', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  requests
    .command('cancel <id>')
    .description('Cancel an access request (requires approval)')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/access-requests/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ idempotencyKey: options.idempotencyKey }),
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
