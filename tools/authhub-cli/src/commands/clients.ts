import { Command } from 'commander';
import { apiFetch, getAgencyId } from '../api-client.js';
import { outputJson, handleError } from '../errors.js';

export function registerClientsCommand(program: Command): void {
  const clients = program.command('clients').description('Manage clients');

  clients
    .command('list')
    .description('List all clients')
    .option('--limit <n>', 'Number of results', '25')
    .option('--offset <n>', 'Pagination offset', '0')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const agencyId = getAgencyId();
        const data = await apiFetch(`/api/clients?limit=${options.limit}&offset=${options.offset}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  clients
    .command('get <id>')
    .description('Get client details')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (id, options) => {
      try {
        const data = await apiFetch(`/api/clients/${id}/detail`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  clients
    .command('create')
    .description('Create a new client')
    .requiredOption('--name <name>', 'Client contact name')
    .requiredOption('--email <email>', 'Client email')
    .requiredOption('--company <company>', 'Company name')
    .option('--website <url>', 'Client website')
    .option('--language <lang>', 'Client language', 'en')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const body: Record<string, unknown> = {
          name: options.name,
          email: options.email,
          company: options.company,
          language: options.language,
        };
        if (options.website) body.website = options.website;

        const data = await apiFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'X-Idempotency-Key': options.idempotencyKey },
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  clients
    .command('update')
    .description('Update an existing client')
    .requiredOption('--id <id>', 'Client ID')
    .option('--name <name>', 'Client contact name')
    .option('--email <email>', 'Client email')
    .option('--company <company>', 'Company name')
    .option('--website <url>', 'Client website')
    .option('--language <lang>', 'Client language')
    .requiredOption('--idempotency-key <key>', 'Idempotency key')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const body: Record<string, unknown> = { id: options.id };
        if (options.name) body.name = options.name;
        if (options.email) body.email = options.email;
        if (options.company) body.company = options.company;
        if (options.website) body.website = options.website;
        if (options.language) body.language = options.language;

        const data = await apiFetch(`/api/clients`, {
          method: 'PUT',
          body: JSON.stringify(body),
          headers: { 'X-Idempotency-Key': options.idempotencyKey },
        });
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });

  clients
    .command('search')
    .description('Search clients by email')
    .requiredOption('--email <email>', 'Email to search')
    .option('--pretty', 'Pretty-print JSON', false)
    .action(async (options) => {
      try {
        const data = await apiFetch(`/api/clients/search?email=${encodeURIComponent(options.email)}`);
        outputJson(data, options.pretty);
      } catch (error) {
        handleError(error);
      }
    });
}
