'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getProfile } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/supabase';
import { Search, Filter, Eye, User as UserIcon, Wrench, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLogEntry {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
  user_name?: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const profileResponse = await getProfile(user.id);
    if (profileResponse.success && profileResponse.data) {
      setCurrentUserRole(profileResponse.data.role);
      // Only super_admin can see all logs
      if (profileResponse.data.role !== 'super_admin' && profileResponse.data.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }

    await loadLogs();
    setLoading(false);
  }

  async function loadLogs() {
    try {
      if (!supabase) return;

      // Fetch logs with user info
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      if (logsData && logsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))];
        
        // Fetch user profiles
        let userProfiles: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          if (profiles) {
            profiles.forEach(p => {
              userProfiles[p.id] = p.full_name;
            });
          }
        }

        // Map logs with user names
        const logsWithUsers = logsData.map(log => ({
          ...log,
          user_name: log.user_id ? userProfiles[log.user_id] || 'Unknown User' : 'System',
        }));

        setLogs(logsWithUsers);
        setFilteredLogs(logsWithUsers);
      } else {
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(search) ||
        log.table_name?.toLowerCase().includes(search) ||
        log.user_name?.toLowerCase().includes(search) ||
        log.record_id?.toLowerCase().includes(search)
      );
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(log => 
        log.user_name?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, userFilter, logs]);

  const getActionBadge = (action: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      INSERT: { bg: 'bg-green-100', text: 'text-green-800' },
      UPDATE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
      LOGIN: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    return badges[action] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getResourceIcon = (tableName: string) => {
    const icons: Record<string, typeof Package> = {
      tools: Package,
      tool_requests: ArrowDownToLine,
      maintenance: Wrench,
      profiles: UserIcon,
    };
    return icons[tableName || ''] || Package;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get unique users for filter
  const uniqueUsers = [...new Set(logs.map(l => l.user_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-4 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1 text-sm lg:text-base">Track all system activities and changes</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] text-sm"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] text-sm"
            >
              <option value="">All Actions</option>
              <option value="INSERT">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] text-sm"
            >
              <option value="">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Record ID</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const badge = getActionBadge(log.action);
                  const Icon = getResourceIcon(log.table_name || '');
                  
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#0B3C6D]/10 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-[#0B3C6D]" />
                          </div>
                          <span className="text-sm text-gray-600">{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 capitalize">{log.table_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {log.record_id ? log.record_id.slice(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right">
                        <button className="text-[#0B3C6D] hover:underline text-sm">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 lg:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">Showing {filteredLogs.length} of {logs.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Timestamp</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User</label>
                  <p className="font-medium text-gray-900">{selectedLog.user_name || 'System'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Action</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(selectedLog.action).bg} ${getActionBadge(selectedLog.action).text}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resource</label>
                  <p className="font-medium text-gray-900 capitalize">{selectedLog.table_name || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Record ID</label>
                  <p className="font-medium text-gray-900 text-sm break-all">{selectedLog.record_id || '-'}</p>
                </div>
              </div>

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <label className="text-sm text-gray-500 block mb-2">Previous Values</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <label className="text-sm text-gray-500 block mb-2">New Values</label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}