'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Calendar, BarChart3, Package, Users } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { name: 'Monthly Tool Inventory Report', type: 'Inventory', date: '2024-03-01', icon: Package },
    { name: 'Tool Usage Summary', type: 'Usage', date: '2024-02-28', icon: BarChart3 },
    { name: 'Maintenance Report', type: 'Maintenance', date: '2024-02-25', icon: FileText },
    { name: 'User Activity Report', type: 'Users', date: '2024-02-20', icon: Users },
  ];

  const quickReports = [
    { name: 'Export All Tools', description: 'Download complete tool inventory' },
    { name: 'Monthly Summary', description: 'Generate monthly report' },
    { name: 'Maintenance Status', description: 'Current maintenance overview' },
    { name: 'Audit Trail', description: 'Complete activity log' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Generate and download reports</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {quickReports.map((report, index) => (
          <motion.div
            key={report.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-shadow"
          >
            <h3 className="font-medium text-gray-800 text-sm lg:text-base">{report.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{report.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Reports</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {reports.map((report, index) => (
            <motion.div
              key={report.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <report.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{report.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{report.type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {report.date}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#0B3C6D] hover:bg-[#0B3C6D]/10 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-[#0B3C6D] to-[#1E6FBE] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Monthly Summary</h3>
            <p className="text-white/80 mt-1">March 2024</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#0B3C6D] rounded-lg font-medium hover:bg-white/90 transition-colors">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">230</p>
            <p className="text-xs text-white/80">Total Tools</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">28</p>
            <p className="text-xs text-white/80">In Use</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">13</p>
            <p className="text-xs text-white/80">Maintenance</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-white/80">Requests</p>
          </div>
        </div>
      </div>
    </div>
  );
}
