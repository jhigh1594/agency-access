import { Command } from 'commander';
import { apiFetch } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerOperationsCommand(program: Command): void {
  const operations = program.command('operations').description('View agent operations');

  operations
    .command('get <id>')
    .description('Get operation status')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/agent/operations/${id}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  operations
    .command('execute <id>')
    .description('Execute an approved operation')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/agent/operations/${id}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'execute' }),
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
