import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerSubscriptionCommand(program: Command): void {
  const subscription = program.command('subscription').description('View subscription details');

  subscription
    .command('show')
    .description('Show current subscription')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/subscriptions/${agencyId}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  subscription
    .command('tier')
    .description('Show current subscription tier')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/subscriptions/${agencyId}/tier`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
