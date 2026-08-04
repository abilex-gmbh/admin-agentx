import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import type * as t from '@/types';
import { apiFetch, extractApiError } from './utils/api';

export const getCreditUsersFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ users: t.CreditUser[] }> => {
    const response = await apiFetch('/api/admin/observability/credits');
    if (!response.ok) await extractApiError(response, 'Failed to load credit balances');
    return (await response.json()) as { users: t.CreditUser[] };
  },
);

export const creditUsersOptions = queryOptions({
  queryKey: ['creditUsers'],
  queryFn: () => getCreditUsersFn().then((result) => result.users),
  staleTime: 30_000,
});

export const getRecentLogsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
  .handler(async ({ data }): Promise<{ entries: t.LogEntry[] }> => {
    const response = await apiFetch(`/api/admin/observability/logs?limit=${data.limit}`);
    if (!response.ok) await extractApiError(response, 'Failed to load recent telemetry');
    return (await response.json()) as { entries: t.LogEntry[] };
  });

export const recentLogsOptions = (limit = 50) =>
  queryOptions({
    queryKey: ['recentLogs', limit],
    queryFn: () => getRecentLogsFn({ data: { limit } }).then((result) => result.entries),
    staleTime: 15_000,
  });

export const addCreditsFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      amount: z.number().int().positive().max(100_000_000),
      userIds: z.array(z.string()).max(10_000),
      applyToAll: z.boolean(),
    }),
  )
  .handler(async ({ data }): Promise<{ updated: number }> => {
    const response = await apiFetch('/api/admin/observability/credits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) await extractApiError(response, 'Failed to add credits');
    return (await response.json()) as { updated: number };
  });
