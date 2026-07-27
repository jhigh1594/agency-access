import {
  META_ACCESS_RECIPES,
  MetaAccessRequestInputSchema,
  MetaAccessRequirementSnapshotSchema,
  type MetaAccessCapability,
  type MetaAccessRequestInput,
  type MetaAccessRequirementSnapshot,
} from '@agency-platform/shared';

const CAPABILITY_TASKS: Record<MetaAccessCapability, readonly string[]> = {
  ad_account_advertise: ['ADVERTISE'],
  ad_account_analyze: ['ANALYZE'],
  page_advertise: ['ADVERTISE'],
  page_publish: ['CREATE_CONTENT'],
  page_moderate: ['MODERATE'],
  page_message: ['MESSAGING'],
  page_insights: ['ANALYZE'],
  instagram_linked_professional_account: [],
};

const ALLOWED_PROVIDER_TASKS = new Set([
  'ADVERTISE',
  'ANALYZE',
  'CREATE_CONTENT',
  'MODERATE',
  'MESSAGING',
]);

function resolveCapabilities(capabilities: readonly MetaAccessCapability[]): string[] {
  const tasks = new Set<string>();

  for (const capability of capabilities) {
    const mappedTasks = CAPABILITY_TASKS[capability];
    if (!mappedTasks) {
      throw new Error(`Unsupported Meta capability: ${capability}`);
    }

    for (const task of mappedTasks) {
      if (!ALLOWED_PROVIDER_TASKS.has(task)) {
        throw new Error(`Unsupported Meta provider task: ${task}`);
      }
      tasks.add(task);
    }
  }

  return [...tasks].sort();
}

function parseRequestInput(input: unknown): MetaAccessRequestInput {
  return MetaAccessRequestInputSchema.parse(input);
}

function createSnapshot(input: unknown): MetaAccessRequirementSnapshot {
  const parsed = parseRequestInput(input);
  const recipe = META_ACCESS_RECIPES[parsed.recipeId];

  const snapshot = {
    recipeId: recipe.id,
    recipeVersion: recipe.version,
    recipeName: recipe.name,
    destinationId: parsed.destinationId,
    summary: recipe.summary,
    permissionSummary: [...recipe.permissionSummary],
    requirements: recipe.requirements.map((requirement) => ({
      ...requirement,
      capabilities: [...requirement.capabilities],
      providerTasks: resolveCapabilities(requirement.capabilities),
    })),
  };

  return MetaAccessRequirementSnapshotSchema.parse(snapshot);
}

export const metaAccessPolicyService = {
  parseRequestInput,
  resolveCapabilities,
  createSnapshot,
};
