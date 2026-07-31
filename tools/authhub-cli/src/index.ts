import { Command } from 'commander';
import { registerLoginCommand } from './commands/login.js';
import { registerWorkspaceCommand } from './commands/workspace.js';
import { registerClientsCommand } from './commands/clients.js';
import { registerRequestsCommand } from './commands/requests.js';
import { registerConnectionsCommand } from './commands/connections.js';
import { registerTemplatesCommand } from './commands/templates.js';
import { registerMembersCommand } from './commands/members.js';
import { registerWebhooksCommand } from './commands/webhooks.js';
import { registerSubscriptionCommand } from './commands/subscription.js';
import { registerOperationsCommand } from './commands/operations.js';
import { handleError } from './errors.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('authhub')
    .description('AuthHub CLI — agent-friendly command interface')
    .version('0.1.0');

  program.action(() => {
    program.help();
  });


  registerLoginCommand(program);
  registerWorkspaceCommand(program);
  registerClientsCommand(program);
  registerRequestsCommand(program);
  registerConnectionsCommand(program);
  registerTemplatesCommand(program);
  registerMembersCommand(program);
  registerWebhooksCommand(program);
  registerSubscriptionCommand(program);
  registerOperationsCommand(program);

  return program;
}
