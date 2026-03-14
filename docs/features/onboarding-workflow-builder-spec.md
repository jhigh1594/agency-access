# Feature Spec: Onboarding Workflow Builder

**Status:** Draft
**Created:** February 14, 2026
**Target:** Phase 1 MVP

---

## Overview

A no-code visual workflow builder that automates the entire client onboarding process after access is granted. Agencies create "playbooks" - reusable workflows that trigger actions automatically when specific events occur.

### The Shift

**Current:** Send link → Get access → Do 15 manual things (2-3 hours)
**New:** Send link → Get access → Workflow does everything automatically (5 minutes)

---

## Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Agencies using workflows | 50% of active agencies |
| Workflows created per agency | 2+ |
| Actions automated per onboarding | 5+ |
| Time saved per client (agency reported) | 30+ minutes |

---

## MVP Scope

### In Scope (Phase 1)
- 5 triggers (Access Request Created, Platform Connected, All Platforms Connected, Expired, Revoked)
- 5 actions (Create Folder, Send Notification, Create Task, Send Email, Webhook)
- 3 integrations (Google Drive, Slack, Resend Email)
- 3 pre-built playbooks
- Visual workflow builder (simple version)
- Workflow run history

### Out of Scope (Future)
- Conditional logic (if/else branches)
- Parallel action execution
- Custom webhooks (just pre-configured)
- Advanced scheduling
- A/B testing workflows

---

## Database Schema

### New Models

```prisma
// ============================================
// ONBOARDING WORKFLOW BUILDER SCHEMA
// ============================================

model OnboardingWorkflow {
  id          String   @id @default(cuid())
  agencyId    String   @map("agency_id")
  name        String
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  isDefault   Boolean  @default(false) @map("is_default")

  // Trigger configuration
  trigger     WorkflowTriggerType @map("trigger_type")
  triggerConfig Json? @map("trigger_config") // e.g., { "platforms": ["google_ads", "meta_ads"] }

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  agency      Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  actions     WorkflowAction[]
  runs        WorkflowRun[]

  @@index([agencyId, isActive])
  @@index([agencyId, isDefault])
  @@map("onboarding_workflows")
}

model WorkflowAction {
  id           String   @id @default(cuid())
  workflowId   String   @map("workflow_id")

  // Action type and configuration
  type         WorkflowActionType @map("action_type")
  config       Json     // Action-specific configuration
  order        Int      @map("execution_order") // Execution order (1, 2, 3...)

  // Retry configuration
  maxRetries   Int      @default(3) @map("max_retries")
  retryDelay   Int      @default(60) @map("retry_delay_seconds") // Seconds between retries

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  workflow     OnboardingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  executions   WorkflowActionExecution[]

  @@index([workflowId, order])
  @@map("workflow_actions")
}

model WorkflowRun {
  id          String   @id @default(cuid())
  workflowId  String   @map("workflow_id")
  agencyId    String   @map("agency_id")

  // Trigger context
  triggerType  WorkflowTriggerType @map("trigger_type")
  triggerData  Json    @map("trigger_data") // Context that triggered this run

  // Status tracking
  status      WorkflowRunStatus @default(queued)

  // Client/Request context (nullable - not all triggers have these)
  clientId    String?  @map("client_id")
  accessRequestId String? @map("access_request_id")

  // Timing
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  failedAt    DateTime? @map("failed_at")

  // Error tracking
  errorMessage String? @map("error_message")
  errorDetails Json?   @map("error_details")

  createdAt   DateTime @default(now()) @map("created_at")

  workflow    OnboardingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  agency      Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: SetNull)
  accessRequest AccessRequest? @relation(fields: [accessRequestId], references: [id], onDelete: SetNull)
  executions  WorkflowActionExecution[]

  @@index([agencyId, status])
  @@index([workflowId, status])
  @@index([clientId])
  @@index([accessRequestId])
  @@map("workflow_runs")
}

model WorkflowActionExecution {
  id           String   @id @default(cuid())
  runId        String   @map("run_id")
  actionId     String   @map("action_id")

  // Execution status
  status       WorkflowExecutionStatus @default(pending)

  // Timing
  startedAt    DateTime? @map("started_at")
  completedAt  DateTime? @map("completed_at")
  failedAt     DateTime? @map("failed_at")

  // Retry tracking
  attemptNumber Int     @default(1) @map("attempt_number")

  // Results
  result       Json?    // Success result data
  errorMessage String?  @map("error_message")
  errorDetails Json?    @map("error_details")

  createdAt    DateTime @default(now()) @map("created_at")

  run          WorkflowRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  action       WorkflowAction @relation(fields: [actionId], references: [id], onDelete: Cascade)

  @@index([runId, status])
  @@index([actionId])
  @@map("workflow_action_executions")
}

// ============================================
// ENUMS
// ============================================

enum WorkflowTriggerType {
  ACCESS_REQUEST_CREATED    // When agency sends a new request
  PLATFORM_CONNECTED        // When client connects a specific platform
  ALL_PLATFORMS_CONNECTED   // When client has authorized all requested platforms
  ACCESS_REQUEST_EXPIRED    // When request passes expiration date
  ACCESS_REVOKED            // When client or agency revokes access
}

enum WorkflowActionType {
  CREATE_FOLDER       // Google Drive, Dropbox, OneDrive
  SEND_NOTIFICATION   // Slack, MS Teams
  CREATE_TASK         // Asana, Monday, ClickUp
  SEND_EMAIL          // Custom emails via Resend
  WEBHOOK             // Custom HTTP request
}

enum WorkflowRunStatus {
  queued      // Waiting to be processed
  running     // Currently executing
  completed   // All actions completed successfully
  failed      // One or more actions failed after retries
  cancelled   // Manually cancelled
}

enum WorkflowExecutionStatus {
  pending     // Waiting to execute
  running     // Currently executing
  completed   // Completed successfully
  failed      // Failed after all retries
  skipped     // Skipped (e.g., due to previous failure)
}
```

### Update Existing Models

```prisma
// Add to Agency model
model Agency {
  // ... existing fields
  workflows   OnboardingWorkflow[]
  workflowRuns WorkflowRun[]
}

// Add to Client model
model Client {
  // ... existing fields
  workflowRuns WorkflowRun[]
}

// Add to AccessRequest model
model AccessRequest {
  // ... existing fields
  workflowRuns WorkflowRun[]
}
```

---

## API Endpoints

### Workflow Management

```
GET    /api/workflows                    # List all workflows for agency
POST   /api/workflows                    # Create new workflow
GET    /api/workflows/:id                # Get workflow details
PUT    /api/workflows/:id                # Update workflow
DELETE /api/workflows/:id                # Delete workflow
PUT    /api/workflows/:id/activate       # Activate workflow
PUT    /api/workflows/:id/deactivate     # Deactivate workflow
PUT    /api/workflows/:id/set-default    # Set as default workflow
```

### Workflow Actions

```
POST   /api/workflows/:id/actions        # Add action to workflow
PUT    /api/workflows/:id/actions/:actionId  # Update action
DELETE /api/workflows/:id/actions/:actionId  # Remove action
PUT    /api/workflows/:id/actions/reorder    # Reorder actions
```

### Workflow Runs

```
GET    /api/workflow-runs                # List all runs for agency
GET    /api/workflow-runs/:id            # Get run details with executions
POST   /api/workflow-runs/:id/retry      # Retry failed run
POST   /api/workflow-runs/:id/cancel     # Cancel running workflow
```

### Playbooks (Pre-built Templates)

```
GET    /api/playbooks                    # List available playbook templates
POST   /api/playbooks/:id/instantiate    # Create workflow from playbook
```

---

## Service Layer

### WorkflowService (`apps/api/src/services/workflow.service.ts`)

```typescript
// Core workflow CRUD
export async function createWorkflow(input: CreateWorkflowInput): Promise<ServiceResult<OnboardingWorkflow>>
export async function updateWorkflow(id: string, input: UpdateWorkflowInput): Promise<ServiceResult<OnboardingWorkflow>>
export async function deleteWorkflow(id: string): Promise<ServiceResult<void>>
export async function getWorkflow(id: string): Promise<ServiceResult<OnboardingWorkflow>>
export async function listWorkflows(agencyId: string): Promise<ServiceResult<OnboardingWorkflow[]>>

// Workflow activation
export async function activateWorkflow(id: string): Promise<ServiceResult<OnboardingWorkflow>>
export async function deactivateWorkflow(id: string): Promise<ServiceResult<OnboardingWorkflow>>
export async function setDefaultWorkflow(id: string): Promise<ServiceResult<OnboardingWorkflow>>

// Action management
export async function addAction(workflowId: string, input: AddActionInput): Promise<ServiceResult<WorkflowAction>>
export async function updateAction(actionId: string, input: UpdateActionInput): Promise<ServiceResult<WorkflowAction>>
export async function deleteAction(actionId: string): Promise<ServiceResult<void>>
export async function reorderActions(workflowId: string, actionOrder: string[]): Promise<ServiceResult<void>>
```

### WorkflowExecutorService (`apps/api/src/services/workflow-executor.service.ts`)

```typescript
// Trigger handling
export async function triggerWorkflows(input: TriggerInput): Promise<ServiceResult<WorkflowRun[]>>

// Execution
export async function executeWorkflowRun(runId: string): Promise<ServiceResult<void>>
export async function executeAction(executionId: string): Promise<ServiceResult<void>>

// Retry logic
export async function retryFailedRun(runId: string): Promise<ServiceResult<void>>
export async function retryAction(executionId: string): Promise<ServiceResult<void>>

// Status management
export async function cancelRun(runId: string): Promise<ServiceResult<void>>
```

### Integration Services

```typescript
// Google Drive Integration
// apps/api/src/services/integrations/google-drive.service.ts
export async function createFolder(input: {
  accessToken: string;
  name: string;
  parentId?: string;
}): Promise<ServiceResult<{ id: string; url: string }>>

// Slack Integration
// apps/api/src/services/integrations/slack.service.ts
export async function sendNotification(input: {
  botToken: string;
  channel: string;
  message: string;
}): Promise<ServiceResult<{ ts: string }>>

// Email Integration (via Resend)
// apps/api/src/services/integrations/email.service.ts
export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<ServiceResult<{ id: string }>>

// Webhook Integration
// apps/api/src/services/integrations/webhook.service.ts
export async function sendWebhook(input: {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: any;
}): Promise<ServiceResult<{ status: number; body: any }>>
```

---

## Background Jobs

### Workflow Execution Queue

```typescript
// apps/api/src/lib/queue.ts
export const workflowQueue = new Queue('workflow-execution', { connection: redisOptions });

// Job types
type WorkflowJobData = {
  runId: string;
  actionId: string;
  executionId: string;
  attemptNumber: number;
};
```

### Worker Implementation

```typescript
// apps/api/src/jobs/workflow-executor.ts
export async function startWorkflowWorker() {
  const worker = new Worker('workflow-execution', async (job: Job<WorkflowJobData>) => {
    const { runId, actionId, executionId, attemptNumber } = job.data;

    // Execute the action
    await executeAction(executionId);

    return { success: true };
  }, {
    connection: redisOptions,
    concurrency: 5, // Process up to 5 actions concurrently
  });

  return worker;
}
```

---

## Trigger Integration Points

### Hook into Existing Flows

```typescript
// 1. ACCESS_REQUEST_CREATED
// Location: apps/api/src/routes/access-requests/index.ts (POST /access-requests)
// After: await accessRequestService.createAccessRequest()
// Add: await workflowExecutor.triggerWorkflows({ type: 'ACCESS_REQUEST_CREATED', data: { requestId, agencyId } })

// 2. PLATFORM_CONNECTED
// Location: apps/api/src/routes/client-auth/oauth-exchange.routes.ts
// After: await connectionService.createPlatformAuthorization()
// Add: await workflowExecutor.triggerWorkflows({ type: 'PLATFORM_CONNECTED', data: { connectionId, platform, agencyId } })

// 3. ALL_PLATFORMS_CONNECTED
// Location: apps/api/src/routes/client-auth/completion.routes.ts
// After: await accessRequestService.markAsCompleted()
// Add: await workflowExecutor.triggerWorkflows({ type: 'ALL_PLATFORMS_CONNECTED', data: { requestId, clientId, agencyId } })

// 4. ACCESS_REQUEST_EXPIRED
// Location: Scheduled job (new)
// Add: apps/api/src/jobs/check-expired-requests.ts

// 5. ACCESS_REVOKED
// Location: apps/api/src/routes/connections/index.ts (DELETE)
// After: await connectionService.revokeAccess()
// Add: await workflowExecutor.triggerWorkflows({ type: 'ACCESS_REVOKED', data: { connectionId, agencyId } })
```

---

## Frontend Components

### Page Structure

```
apps/web/src/app/(authenticated)/workflows/
├── page.tsx                      # Workflow list page
├── new/
│   └── page.tsx                  # Create new workflow
├── [id]/
│   ├── page.tsx                  # Edit workflow
│   └── runs/
│       └── page.tsx              # View run history

apps/web/src/app/(authenticated)/workflow-runs/
├── page.tsx                      # All runs across workflows
└── [id]/
    └── page.tsx                  # Run details with execution log
```

### Component Structure

```
apps/web/src/components/workflows/
├── workflow-list.tsx             # List of workflows with status
├── workflow-card.tsx             # Individual workflow card
├── workflow-builder.tsx          # Visual workflow builder
├── trigger-selector.tsx          # Select trigger type
├── action-card.tsx               # Individual action in workflow
├── action-selector.tsx           # Add new action modal
├── action-config-panels/
│   ├── create-folder-config.tsx  # Google Drive folder config
│   ├── send-notification-config.tsx  # Slack notification config
│   ├── send-email-config.tsx     # Email config
│   └── webhook-config.tsx        # Webhook config
├── workflow-run-history.tsx      # Run history list
├── workflow-run-detail.tsx       # Single run with execution log
└── playbook-gallery.tsx          # Pre-built playbook templates
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Workflows                                                    [+ New]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚡ Standard Client Onboarding                      Active ✓     │   │
│  │                                                                   │   │
│  │ Trigger: All Platforms Connected                                 │   │
│  │ Actions: Create Drive folder → Slack notification → Welcome email│   │
│  │                                                                   │   │
│  │ Runs: 23 | Success: 21 | Failed: 2 | Last run: 2 hours ago      │   │
│  │                                          [Edit] [View Runs] [...] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 eCommerce Client Onboarding                      Inactive    │   │
│  │ ...                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Workflow Builder UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│  New Workflow                                            [Save] [Test]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Name: [Standard Client Onboarding___________________]                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ TRIGGER                                                          │  │
│  │ ┌──────────────────────────────────────────────────────────────┐│  │
│  │ │ 🟢 All Platforms Connected                                   ││  │
│  │ │ When client authorizes all requested platforms               ││  │
│  │ └──────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ACTIONS                                                          │  │
│  │                                                                  │  │
│  │ ┌──────────────────────────────────────────────────────────────┐│  │
│  │ │ 1. 📁 Create Folder                                    [✕]  ││  │
│  │ │    Google Drive: /Clients/{client.name}                      ││  │
│  │ │                                                    [Edit]   ││  │
│  │ └──────────────────────────────────────────────────────────────┘│  │
│  │                              │                                   │  │
│  │                              ▼                                   │  │
│  │ ┌──────────────────────────────────────────────────────────────┐│  │
│  │ │ 2. 💬 Send Notification                                [✕]  ││  │
│  │ │    Slack: #new-clients                                       ││  │
│  │ │    "New client {client.name} connected all platforms!"       ││  │
│  │ │                                                    [Edit]   ││  │
│  │ └──────────────────────────────────────────────────────────────┘│  │
│  │                              │                                   │  │
│  │                              ▼                                   │  │
│  │ ┌──────────────────────────────────────────────────────────────┐│  │
│  │ │ 3. 📧 Send Email                                       [✕]  ││  │
│  │ │    To: {client.email}                                        ││  │
│  │ │    Subject: "Welcome to {agency.name}!"                      ││  │
│  │ │                                                    [Edit]   ││  │
│  │ └──────────────────────────────────────────────────────────────┘│  │
│  │                                                                  │  │
│  │ [+ Add Action]                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pre-Built Playbooks

### 1. Standard Client Onboarding

```json
{
  "name": "Standard Client Onboarding",
  "description": "Basic onboarding: folder, notification, welcome email",
  "trigger": "ALL_PLATFORMS_CONNECTED",
  "actions": [
    {
      "type": "CREATE_FOLDER",
      "config": {
        "provider": "google_drive",
        "name": "{client.company}",
        "parentId": "{agency.driveClientId}"
      },
      "order": 1
    },
    {
      "type": "SEND_NOTIFICATION",
      "config": {
        "provider": "slack",
        "channel": "#new-clients",
        "message": "🎉 New client onboarded: {client.name} ({client.company})"
      },
      "order": 2
    },
    {
      "type": "SEND_EMAIL",
      "config": {
        "to": "{client.email}",
        "subject": "Welcome to {agency.name}!",
        "template": "welcome-client"
      },
      "order": 3
    }
  ]
}
```

### 2. eCommerce Client Setup

```json
{
  "name": "eCommerce Client Setup",
  "description": "For clients with Shopify/online stores",
  "trigger": "ALL_PLATFORMS_CONNECTED",
  "actions": [
    {
      "type": "CREATE_FOLDER",
      "config": {
        "provider": "google_drive",
        "name": "{client.company} - eCommerce",
        "subfolders": ["Product Feeds", "Reporting", "Creative"]
      },
      "order": 1
    },
    {
      "type": "SEND_NOTIFICATION",
      "config": {
        "provider": "slack",
        "channel": "#ecommerce-team",
        "message": "🛒 New eCommerce client: {client.name}"
      },
      "order": 2
    }
  ]
}
```

### 3. Reactivation Workflow

```json
{
  "name": "Client Reactivation",
  "description": "For existing clients coming back",
  "trigger": "ACCESS_REQUEST_CREATED",
  "triggerConfig": {
    "existingClientOnly": true
  },
  "actions": [
    {
      "type": "SEND_EMAIL",
      "config": {
        "to": "{client.email}",
        "subject": "Welcome back to {agency.name}!",
        "template": "welcome-back"
      },
      "order": 1
    },
    {
      "type": "SEND_NOTIFICATION",
      "config": {
        "provider": "slack",
        "channel": "#account-management",
        "message": "🔄 Existing client reactivating: {client.name}"
      },
      "order": 2
    }
  ]
}
```

---

## Variable Substitution

Available variables for use in action configs:

```typescript
// Client variables
{client.name}          // Client full name
{client.email}         // Client email
{client.company}       // Client company name
{client.id}            // Client ID

// Agency variables
{agency.name}          // Agency name
{agency.id}            // Agency ID

// Request variables
{request.id}           // Access request ID
{request.platforms}    // List of platforms requested
{request.createdAt}    // When request was created

// Platform variables (for PLATFORM_CONNECTED trigger)
{platform.name}        // Platform that was connected
{platform.id}          // Platform ID

// Date/Time
{date.today}           // Current date (YYYY-MM-DD)
{date.now}             // Current timestamp (ISO)
```

---

## Configuration Requirements

### New Environment Variables

```bash
# Google Drive Integration
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3001/api/integrations/google-drive/callback

# Slack Integration
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3001/api/integrations/slack/callback

# Email (Resend - already configured)
RESEND_API_KEY=  # Already exists
```

### Agency Integration Storage

Need to store integration tokens per agency:

```prisma
model AgencyIntegration {
  id          String   @id @default(cuid())
  agencyId    String   @map("agency_id")
  provider    String   // 'google_drive', 'slack', etc.
  secretId    String   @map("secret_id") // Infisical reference
  metadata    Json?    // Non-sensitive metadata (e.g., Slack team ID)

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  agency      Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)

  @@unique([agencyId, provider])
  @@map("agency_integrations")
}
```

---

## Implementation Order

### Phase 1A: Core Infrastructure (Week 1)

1. Database migrations (OnboardingWorkflow, WorkflowAction, etc.)
2. Prisma client generation
3. WorkflowService (CRUD operations)
4. API routes for workflow management
5. Basic frontend: Workflow list page

### Phase 1B: Execution Engine (Week 2)

1. WorkflowExecutorService
2. BullMQ queue and worker setup
3. Variable substitution system
4. Trigger integration hooks in existing flows
5. Workflow run tracking

### Phase 1C: Integrations (Week 3)

1. Google Drive integration (create folder)
2. Slack integration (send notification)
3. Email integration (Resend - already have)
4. Webhook integration (basic HTTP client)
5. Integration management UI

### Phase 1D: Polish & Playbooks (Week 4)

1. Workflow builder UI (visual editor)
2. Pre-built playbook templates
3. Run history and details UI
4. Error handling and retry UI
5. Testing and documentation

---

## Testing Strategy

### Unit Tests

```typescript
// WorkflowService tests
describe('WorkflowService', () => {
  describe('createWorkflow', () => {
    it('should create workflow with valid input')
    it('should require at least one action')
    it('should validate trigger config')
  })

  describe('triggerWorkflows', () => {
    it('should find matching active workflows')
    it('should create workflow runs for each match')
    it('should pass trigger data to runs')
  })
})

// WorkflowExecutorService tests
describe('WorkflowExecutorService', () => {
  describe('executeAction', () => {
    it('should execute CREATE_FOLDER action')
    it('should execute SEND_NOTIFICATION action')
    it('should handle action failures with retry')
    it('should mark action as failed after max retries')
  })
})
```

### Integration Tests

```typescript
describe('Workflow Execution Integration', () => {
  it('should trigger workflow when access request created')
  it('should trigger workflow when platform connected')
  it('should trigger workflow when all platforms connected')
  it('should handle variable substitution in actions')
  it('should log all action executions')
})
```

---

## Security Considerations

1. **Integration tokens** stored in Infisical (never in database)
2. **Webhook URLs** validated against allowlist (prevent SSRF)
3. **Rate limiting** on workflow execution (prevent abuse)
4. **Audit logging** for all workflow executions
5. **Access control** - only agency admins can manage workflows

---

## Open Questions

1. **Should workflows support branches/conditions?** (Out of scope for MVP, but plan schema to support later)
2. **How to handle agency-level integrations?** (OAuth per agency vs. platform-level)
3. **What's the retry policy for failed actions?** (3 retries with exponential backoff?)
4. **Should we support workflow templates from other agencies?** (Marketplace potential?)

---

## Appendix: Error Codes

| Code | Description |
|------|-------------|
| `WORKFLOW_NOT_FOUND` | Workflow ID doesn't exist |
| `WORKFLOW_INACTIVE` | Cannot execute inactive workflow |
| `ACTION_EXECUTION_FAILED` | Action failed after all retries |
| `INTEGRATION_NOT_CONFIGURED` | Agency hasn't connected required integration |
| `INVALID_TRIGGER_CONFIG` | Trigger configuration is invalid |
| `INVALID_ACTION_CONFIG` | Action configuration is invalid |
| `VARIABLE_SUBSTITUTION_FAILED` | Missing required variable |
| `WEBHOOK_FAILED` | Webhook returned non-2xx response |
