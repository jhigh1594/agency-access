import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerConnectionsCommand(program: Command): void {
  const connections = program.command('connections').description('Manage platform connections');

  connections
    .command('list')
    .description('List agency platform connections')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const data = await apiFetch('/api/connections');
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  connections
    .command('check')
    .description('Check connection readiness for platforms')
    .requiredOption('--platforms <platforms>', 'Comma-separated platforms')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const data = await apiFetch('/api/token-health');
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  connections
    .command('handoff')
    .description('Start a connection handoff — returns AuthHub URL for owner to complete')
    .requiredOption('--platform <platform>', 'Platform to connect')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const data = await apiFetch('/api/connections', {
          method: 'POST',
          body: JSON.stringify({ platform: options.platform, idempotencyKey: options.idempotencyKey }),
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  connections
    .command('revoke <id>')
    .description('Revoke a connection (requires approval)')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/connections/${id}/revoke`, {
          method: 'POST',
          body: JSON.stringify({ idempotencyKey: options.idempotencyKey }),
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
