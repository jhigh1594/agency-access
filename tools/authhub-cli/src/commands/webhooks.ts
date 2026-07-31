import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerWebhooksCommand(program: Command): void {
  const webhooks = program.command('webhooks').description('View webhook configuration');

  webhooks
    .command('show')
    .description('Show webhook endpoint configuration')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/agencies/${agencyId}/webhook-endpoint`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  webhooks
    .command('deliveries')
    .description('Show recent webhook deliveries')
    .option('--limit <n>', 'Number of results', '25')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/agencies/${agencyId}/webhook-deliveries?limit=${options.limit}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
