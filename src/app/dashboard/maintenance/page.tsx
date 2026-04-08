'use client';

import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, AlertTriangle, Calendar, User } from 'lucide-react';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { mockMaintenanceRecords } from '@/data/mockData';

export default function MaintenancePage() {
  const stats = [
    { label: 'In Progress', value: 2, icon: Wrench, color: 'bg-blue-100 text-blue-600' },
    { label: 'Scheduled', value: 5, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: 12, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Overdue', value: 1, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Track and manage tool maintenance</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] text-sm">
          <Wrench className="w-4 h-4" />
          <span className="hidden sm:inline">Schedule Maintenance</span>
          <span className="sm:hidden">Schedule</span>
        </button>
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
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockMaintenanceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{record.toolName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{record.type}</td>
                  <td className="px-6 py-4"><StatusBadge status={record.status as any} size="sm" /></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.technician}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.startDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.endDate || 'ongoing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
