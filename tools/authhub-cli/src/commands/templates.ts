import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerTemplatesCommand(program: Command): void {
  program
    .command('templates')
    .description('List access request templates')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/agencies/${agencyId}/templates`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
