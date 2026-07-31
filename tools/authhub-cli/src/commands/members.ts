import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerMembersCommand(program: Command): void {
  program
    .command('members')
    .description('List agency team members')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/agencies/${agencyId}/members`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
