'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, AlertTriangle, Calendar, Ban } from 'lucide-react';
import { useMaintenance, useCreateMaintenance, useProfile } from '@/hooks/api';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { Maintenance } from '@/lib/database.types';

export default function MaintenancePage() {
  const { data: records = [] } = useMaintenance();
  const { data: profile } = useProfile();
  const { mutateAsync: createMaintenance } = useCreateMaintenance();

  const userRole = profile?.role ?? null;
  const canSchedule = userRole && ['super_admin', 'admin'].includes(userRole);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tool_id: '',
    maintenance_type: 'inspection' as 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other',
    description: '',
    scheduled_date: '',
    cost: '',
    notes: '',
  });

  const stats = [
    { label: 'In Progress', value: (records as Maintenance[]).filter(r => r.status === 'in_progress').length, icon: Wrench, color: 'bg-blue-100 text-blue-600' },
    { label: 'Scheduled', value: (records as Maintenance[]).filter(r => r.status === 'scheduled').length, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: (records as Maintenance[]).filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Overdue', value: 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Track and manage tool maintenance</p>
        </div>
        {canSchedule ? (
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] text-sm">
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-bold text-gray-800">{stat.value}</p><p className="text-sm text-gray-500">{stat.label}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Maintenance Records</h3></div>
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
              {(records as Maintenance[]).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No maintenance records found</p></td></tr>
              ) : (
                (records as Maintenance[]).map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{record.tool_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{record.maintenance_type}</td>
                    <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : 'N/A'}</td>
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
