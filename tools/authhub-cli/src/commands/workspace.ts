import { Command } from 'commander';
import { apiFetch } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerWorkspaceCommand(program: Command): void {
  program
    .command('workspace')
    .description('Show workspace context — agency snapshot, clients, connections, requests')
    .option('--json', 'Output as JSON (default)', true)
    .option('--text', 'Output as human-readable text', false)
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const data = await apiFetch('/api/dashboard');
        if (options.text) {
          outputJson(data, options.pretty);
        } else {
          outputJson(data, options.pretty);
        }
      } catch (error) {
        handleError(error);
      }
    });
}
