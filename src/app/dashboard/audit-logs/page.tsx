'use client';

import { useState } from 'react';
import { useRecentActivity, useProfile } from '@/hooks/api';
import { Search, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { AuditLog } from '@/lib/database.types';

interface AuditLogEntry extends AuditLog {
  user_name?: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { data: logs = [] } = useRecentActivity(100);
  const { data: profile } = useProfile();

  const currentUserRole = profile?.role ?? null;

  // Redirect if not super_admin or admin
  if (currentUserRole && currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const searchFiltered = (logs as AuditLogEntry[]).filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.table_name?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#0B3C6D] mb-6">Audit Logs</h1>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Table</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">IP Address</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {searchFiltered.slice(0, 50).map((log: AuditLogEntry) => (
              <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{log.action}</td>
                <td className="px-4 py-3 text-sm">{log.table_name || '-'}</td>
                <td className="px-4 py-3 text-sm">{log.user_name || 'System'}</td>
                <td className="px-4 py-3 text-sm font-mono">{log.ip_address || '-'}</td>
                <td className="px-4 py-3 text-sm">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedLog(log)} className="text-[#0B3C6D] hover:text-[#0B3C6D]/80">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {searchFiltered.length === 0 && (
          <div className="text-center py-8 text-gray-500">No audit logs found.</div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Audit Log Details</h3>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-gray-500">Action</label><p className="text-gray-900">{selectedLog.action}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Table</label><p className="text-gray-900">{selectedLog.table_name || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">User ID</label><p className="text-gray-900">{selectedLog.user_id || 'System'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">IP Address</label><p className="text-gray-900 font-mono">{selectedLog.ip_address || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Date</label><p className="text-gray-900">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '-'}</p></div>
                {selectedLog.old_values && (
                  <div><label className="text-sm font-medium text-gray-500">Old Values</label><pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(selectedLog.old_values, null, 2)}</pre></div>
                )}
                {selectedLog.new_values && (
                  <div><label className="text-sm font-medium text-gray-500">New Values</label><pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(selectedLog.new_values, null, 2)}</pre></div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
