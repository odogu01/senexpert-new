'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, BarChart3, Package, Ban } from 'lucide-react';
import { useTools, useMaintenance, useProfile } from '@/hooks/api';

export default function ReportsPage() {
  const router = useRouter();
  const { data: tools = [] } = useTools();
  const { data: maintenance = [] } = useMaintenance();
  const { data: profile } = useProfile();

  const userRole = profile?.role ?? null;
  const toolCount = tools.length;
  const maintenanceCount = maintenance.length;
  const canExport = userRole && ['super_admin', 'admin', 'dev'].includes(userRole);

  const quickReports = [
    { name: 'Export All Tools', description: 'Download complete tool inventory', icon: Package, disabled: !canExport, action: () => console.log('Export tools') },
    { name: 'Maintenance Status', description: 'Current maintenance overview', icon: BarChart3, disabled: !canExport, action: () => console.log('Maintenance status') },
    { name: 'Monthly Summary', description: 'Generate monthly report', icon: FileText, disabled: false, action: () => console.log('Monthly summary') },
    { name: 'Audit Trail', description: 'Complete activity log', icon: Calendar, disabled: userRole !== 'super_admin' && userRole !== 'dev', action: () => router.push('/dashboard/audit-logs') },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Generate and download reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{toolCount}</p><p className="text-sm text-gray-500">Total Tools</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-gray-800">{maintenanceCount}</p><p className="text-sm text-gray-500">Maintenance Records</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {quickReports.map((report, index) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${report.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !report.disabled && report.action()}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.disabled ? 'bg-gray-100' : 'bg-[#0B3C6D]/10'}`}>
                <report.icon className={`w-5 h-5 ${report.disabled ? 'text-gray-400' : 'text-[#0B3C6D]'}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 text-sm lg:text-base">{report.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                {report.disabled && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Ban className="w-3 h-3" /> Access denied</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
