'use client';

import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ApprovalCard } from '@/components/agent-operations/approval-card';
import { authorizedApiFetch } from '@/lib/api/authorized-api-fetch';
import { decideAgentOperation, getAgentOperation } from '@/lib/api/agents';

export default function AgentOperationApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const { userId, orgId, getToken } = useAuth();
  const queryClient = useQueryClient();
  const principalClerkId = orgId || userId;
  const agencyQuery = useQuery({
    queryKey: ['agent-approval-agency', principalClerkId], enabled: Boolean(principalClerkId),
    queryFn: async () => (await authorizedApiFetch<{ data: Array<{ id: string; name: string }> }>(`/api/agencies?clerkUserId=${encodeURIComponent(principalClerkId as string)}`, { getToken })).data[0] ?? null,
  });
  const agencyId = agencyQuery.data?.id;
  const operationQuery = useQuery({
    queryKey: ['agent-operation', agencyId, id], enabled: Boolean(agencyId && id),
    queryFn: () => getAgentOperation(agencyId as string, id, getToken), retry: false,
  });
  const decisionMutation = useMutation({
    mutationFn: (decision: 'approved' | 'declined') => decideAgentOperation(agencyId as string, id, decision, getToken),
    onSuccess: (operation) => {
      queryClient.setQueryData(['agent-operation', agencyId, id], operation);
      void queryClient.invalidateQueries({ queryKey: ['settings-agent-grants', agencyId] });
    },
  });
  if (agencyQuery.isLoading || operationQuery.isLoading) return <main className="mx-auto max-w-3xl p-8"><p role="status">Loading approval…</p></main>;
  if (!agencyId || agencyQuery.isError || operationQuery.isError || !operationQuery.data) return <main className="mx-auto max-w-3xl p-8"><div role="alert" className="rounded-xl border border-coral/30 bg-card p-6"><h1 className="text-xl font-semibold">Approval unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This operation may belong to another agency, be unavailable, or have been removed.</p></div></main>;
  return <main className="mx-auto max-w-3xl p-6 sm:p-10"><ApprovalCard operation={operationQuery.data} isSubmitting={decisionMutation.isPending} onDecision={(decision) => decisionMutation.mutateAsync(decision).then(() => undefined)} />{decisionMutation.isError && <p role="alert" className="mt-4 text-sm text-coral">The decision was not saved. Refresh to see the current operation state.</p>}</main>;
}
