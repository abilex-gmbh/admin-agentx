import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type * as t from '@/types';
import { addCreditsFn, creditUsersOptions, recentLogsOptions } from '@/server';
import { LoadingState, EmptyState } from '@/components/shared';
import { notifyError, notifySuccess } from '@/utils';
import { useLocalize } from '@/hooks';

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}

function compactJson(value: Record<string, string | number | boolean | null> | undefined): string | null {
  if (!value) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

export function ObservabilityPage() {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [amount, setAmount] = useState('1000');
  const [applyToAll, setApplyToAll] = useState(false);
  const { data: users = [], isLoading: loadingUsers } = useQuery(creditUsersOptions);
  const { data: entries = [], isLoading: loadingLogs } = useQuery(recentLogsOptions());
  const selectedCount = applyToAll ? users.length : selected.size;
  const canSubmit = Number.isInteger(Number(amount)) && Number(amount) > 0 && selectedCount > 0;

  const creditMutation = useMutation({
    mutationFn: () =>
      addCreditsFn({
        data: { amount: Number(amount), userIds: [...selected], applyToAll },
      }),
    onSuccess: ({ updated }) => {
      queryClient.invalidateQueries({ queryKey: ['creditUsers'] });
      setSelected(new Set());
      setApplyToAll(false);
      notifySuccess(localize('com_observability_credits_added', { count: updated }));
    },
    onError: (error: Error) => notifyError(error.message),
  });

  const allVisibleSelected = useMemo(
    () => users.length > 0 && users.every((user) => selected.has(user.id)),
    [selected, users],
  );

  const toggleAll = () => {
    setApplyToAll(false);
    setSelected(allVisibleSelected ? new Set() : new Set(users.map((user) => user.id)));
  };

  if (loadingUsers || loadingLogs) return <LoadingState />;

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
      <section className="rounded-lg border border-(--cui-color-stroke-default) bg-(--cui-color-background-panel)">
        <div className="flex flex-col gap-3 border-b border-(--cui-color-stroke-default) px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-(--cui-color-text-default)">{localize('com_observability_credits_title')}</h2>
            <p className="text-xs text-(--cui-color-text-muted)">{localize('com_observability_credits_desc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label={localize('com_observability_credit_amount')}
              className="h-8 w-28 rounded border border-(--cui-color-stroke-default) bg-transparent px-2 text-sm"
            />
            <label className="flex items-center gap-1.5 text-xs text-(--cui-color-text-muted)">
              <input type="checkbox" checked={applyToAll} onChange={(event) => setApplyToAll(event.target.checked)} />
              {localize('com_observability_all_users')}
            </label>
            <button
              type="button"
              disabled={!canSubmit || creditMutation.isPending}
              onClick={() => creditMutation.mutate()}
              className="rounded-md bg-(--cui-color-accent) px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {localize('com_observability_add_credits', { count: selectedCount })}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-(--cui-color-background-muted) text-xs text-(--cui-color-text-muted)">
              <tr>
                <th className="w-10 px-3 py-2"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label={localize('com_observability_select_all')} /></th>
                <th className="px-3 py-2">{localize('com_observability_user')}</th>
                <th className="px-3 py-2">{localize('com_observability_balance')}</th>
                <th className="px-3 py-2">{localize('com_observability_last_set')}</th>
                <th className="px-3 py-2">{localize('com_observability_daily_usage')}</th>
                <th className="px-3 py-2">{localize('com_observability_days_left')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => <CreditRow key={user.id} user={user} selected={selected.has(user.id)} onToggle={() => setSelected((current) => {
                const next = new Set(current);
                if (next.has(user.id)) next.delete(user.id); else next.add(user.id);
                return next;
              })} />)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-(--cui-color-stroke-default) bg-(--cui-color-background-panel)">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--cui-color-stroke-default) px-3 py-3">
          <div>
            <h2 className="text-base font-semibold text-(--cui-color-text-default)">{localize('com_observability_logs_title')}</h2>
            <p className="text-xs text-(--cui-color-text-muted)">{localize('com_observability_logs_desc')}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <GrafanaLink href="/grafana/" label={localize('com_observability_open_grafana')} />
            <GrafanaLink href="/grafana/d/agentx-librechat-realtime" label={localize('com_observability_grafana_realtime')} />
            <GrafanaLink href="/grafana/d/agentx-librechat-history" label={localize('com_observability_grafana_history')} />
            <GrafanaLink href="/grafana/d/agentx-librechat-monthly-report" label={localize('com_observability_grafana_monthly')} />
          </div>
        </div>
        {entries.length === 0 ? <EmptyState message={localize('com_observability_logs_empty')} /> : <div className="divide-y divide-(--cui-color-stroke-default)">{entries.map((entry, index) => <LogRow key={`${entry.createdAt}-${index}`} entry={entry} />)}</div>}
      </section>
    </div>
  );
}

function GrafanaLink({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border border-(--cui-color-stroke-default) px-2 py-1 text-xs text-(--cui-color-text-default)">{label}</a>;
}

function CreditRow({ user, selected, onToggle }: { user: t.CreditUser; selected: boolean; onToggle: () => void }) {
  return <tr className="border-t border-(--cui-color-stroke-default)/60 text-(--cui-color-text-default)">
    <td className="px-3 py-2"><input type="checkbox" checked={selected} onChange={onToggle} aria-label={user.email} /></td>
    <td className="px-3 py-2"><div className="font-medium">{user.name || user.username || user.email}</div><div className="text-xs text-(--cui-color-text-muted)">{user.email}</div></td>
    <td className="px-3 py-2 tabular-nums">{formatNumber(user.tokenCredits)}</td>
    <td className="px-3 py-2 text-xs">{formatDate(user.lastSetAt)}</td>
    <td className="px-3 py-2 tabular-nums">{formatNumber(user.dailyUsage)}</td>
    <td className="px-3 py-2">{user.projectedDays == null ? '—' : `${user.projectedDays.toFixed(1)} d`}</td>
  </tr>;
}

function LogRow({ entry }: { entry: t.LogEntry }) {
  const context = compactJson(entry.addedContext);
  const text = entry.text || entry.content?.map((part) => part.text ?? '').filter(Boolean).join('\n') || '—';
  return <article className="grid gap-2 px-3 py-3 md:grid-cols-[10rem_8rem_minmax(0,1fr)]">
    <div className="text-xs text-(--cui-color-text-muted)">{formatDate(entry.createdAt)}<br />{entry.chatType}{entry.projectContextApplied ? ' · project context' : ''}</div>
    <div className="text-xs"><span className="rounded bg-(--cui-color-background-muted) px-1.5 py-0.5">{entry.requestOrResponse}</span><br />{entry.model || entry.endpoint || '—'}</div>
    <div className="min-w-0"><p className="line-clamp-4 whitespace-pre-wrap wrap-break-word text-sm">{text}</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--cui-color-text-muted)"><span>tokens: {formatNumber(entry.tokenCount ?? 0)}</span>{entry.telemetry.map((item, index) => <span key={`${item.tokenType}-${index}`}>{item.tokenType}: {formatNumber(item.inputTokens ?? item.rawAmount ?? 0)} in / {formatNumber(item.writeTokens ?? item.readTokens ?? 0)} out · {formatNumber(item.tokenValue ?? 0)} credits{item.rate != null ? ` @ ${item.rate}` : ''}</span>)}{entry.error && <span className="text-(--cui-color-text-danger)">error</span>}</div>{context && <details className="mt-1 text-xs text-(--cui-color-text-muted)"><summary>Added context</summary><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap">{context}</pre></details>}</div>
  </article>;
}
