/**
 * Query key factory for TanStack Query.
 *
 * Every domain has a structured key so we can invalidate cache at any level:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.tools.all })         // everything tools
 *   queryClient.invalidateQueries({ queryKey: queryKeys.tools.list(filters) }) // specific list
 */
export const queryKeys = {
  tools: {
    all: ['tools'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['tools', 'list', filters] as const,
    detail: (id: string) => ['tools', 'detail', id] as const,
    stats: ['tools', 'stats'] as const,
    categories: ['tools', 'categories'] as const,
  },
  toolRequests: {
    all: ['tool-requests'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['tool-requests', 'list', filters] as const,
  },
  financialRequests: {
    all: ['financial-requests'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['financial-requests', 'list', filters] as const,
  },
  maintenance: {
    all: ['maintenance'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['maintenance', 'list', filters] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (unreadOnly?: boolean) => ['alerts', 'list', { unreadOnly }] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
    list: (limit?: number) => ['audit-logs', 'list', { limit }] as const,
    filtered: (filters?: Record<string, unknown>) =>
      ['audit-logs', 'filtered', filters] as const,
  },
  profile: {
    all: ['profile'] as const,
  },
  users: {
    all: ['users'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
};
