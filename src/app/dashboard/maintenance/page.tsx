'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, AlertTriangle, Calendar, User, Plus, Ban } from 'lucide-react';
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceStatus } from '@/services/toolsService';
import { getCurrentUser, getProfile } from '@/services/authService';
import { getTools } from '@/services/toolsService';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { Maintenance, Tool } from '@/lib/database.types';
import type { UserRole } from '@/lib/supabase';

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tool_id: '',
    maintenance_type: 'inspection' as 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other',
    description: '',
    scheduled_date: '',
    cost: '',
    notes: '',
  });

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
      setUserRole(profileResponse.data.role);
    }

    await loadData();
    setLoading(false);
  }

  // Permission: HR cannot schedule maintenance
  const canSchedule = userRole && ['super_admin', 'admin', 'manager', 'operator'].includes(userRole);

  async function loadData() {
    try {
      const [recordsRes, toolsRes] = await Promise.all([
        getMaintenanceRecords(),
        getTools(),
      ]);
      if (recordsRes.success && recordsRes.data) {
        setRecords(recordsRes.data);
      }
      if (toolsRes.success && toolsRes.data) {
        setTools(toolsRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  const stats = [
    { label: 'In Progress', value: records.filter(r => r.status === 'in_progress').length, icon: Wrench, color: 'bg-blue-100 text-blue-600' },
    { label: 'Scheduled', value: records.filter(r => r.status === 'scheduled').length, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: records.filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Overdue', value: 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Track and manage tool maintenance</p>
        </div>
        {canSchedule ? (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] text-sm"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Maintenance</span>
            <span className="sm:hidden">Schedule</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Ban className="w-4 h-4" />
            <span>HR cannot schedule maintenance</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Maintenance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No maintenance records found</p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{record.tool_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{record.maintenance_type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}