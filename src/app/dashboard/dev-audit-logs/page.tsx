'use client';

import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/api';
import { getAuthHeaders, throwIfError } from '@/lib/query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type DevAuditCommit = {
  id: string;
  commit_sha: string;
  message: string;
  author_name: string;
  committed_at: string;
  pushed_at: string;
  branch: string;
  repository: string;
  url: string;
  feature_added: boolean;
  changed_files: string[];
};

export default function DeveloperAuditLogsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['dev-audit-logs'],
    queryFn: async () => {
      const response = await fetch('/api/dev-audit-logs?limit=200', { headers: getAuthHeaders() });
      return throwIfError<DevAuditCommit[]>(await response.json());
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token') && profile?.role === 'dev',
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (profile && profile.role !== 'dev') router.replace('/dashboard');
  }, [profile, router]);

  if (!profile || profile.role !== 'dev') return null;

  return (
    <main className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-[#0B3C6D]">Developer Audit</h1>
      <p className="mb-6 text-sm text-gray-500">Code commits pushed to GitHub, including detected feature additions.</p>
      {isLoading && <p className="text-gray-500">Loading audit records…</p>}
      {error && <p className="text-red-600">Unable to load developer audit records.</p>}
      {!isLoading && !error && logs.length === 0 && <p className="text-gray-500">No developer audit records yet.</p>}
      {!!logs.length && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600"><tr>
              <th className="px-4 py-3">Change</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Commit time</th><th className="px-4 py-3">Pushed time</th>
            </tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id} className="border-t border-gray-100 align-top">
              <td className="max-w-2xl px-4 py-3 text-sm">{log.feature_added && <span className="mr-2 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Feature added</span>}{log.url ? <a className="text-[#0B3C6D] hover:underline" href={log.url} target="_blank" rel="noreferrer">{log.message.split('\n', 1)[0]}</a> : log.message.split('\n', 1)[0]}<div className="mt-1 font-mono text-xs text-gray-400">{log.commit_sha.slice(0, 8)} · {log.repository}</div>{!!log.changed_files?.length && <details className="mt-2 text-xs"><summary className="cursor-pointer text-gray-500">{log.changed_files.length} changed file(s)</summary><ul className="mt-1 list-inside list-disc text-gray-500">{log.changed_files.map((file) => <li key={file} className="break-all">{file}</li>)}</ul></details>}</td>
              <td className="px-4 py-3 text-sm">{log.author_name}</td><td className="px-4 py-3 text-sm">{log.branch}</td><td className="whitespace-nowrap px-4 py-3 text-sm">{new Date(log.committed_at).toLocaleString()}</td><td className="whitespace-nowrap px-4 py-3 text-sm">{new Date(log.pushed_at).toLocaleString()}</td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
