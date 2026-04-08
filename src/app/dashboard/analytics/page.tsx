'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Package, Clock, AlertTriangle } from 'lucide-react';
import { toolCategoryDistribution, locationDistribution, usageAnalytics } from '@/data/mockData';

export default function AnalyticsPage() {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Tool usage and performance insights</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 lg:w-5 h-4 lg:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg lg:text-2xl font-bold text-gray-800">{usageAnalytics.utilizationRate}%</p>
              <p className="text-xs lg:text-sm text-gray-500">Utilization</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{usageAnalytics.averageDowntime} days</p>
              <p className="text-sm text-gray-500">Avg Downtime</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{usageAnalytics.mostUsedTools[0].uses}</p>
              <p className="text-sm text-gray-500">Top Tool Uses</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">2.5%</p>
              <p className="text-sm text-gray-500">Downtime Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Tools */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Most Used Tools</h3>
          <div className="space-y-4">
            {usageAnalytics.mostUsedTools.map((tool, index) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#0B3C6D]/10 text-[#0B3C6D] rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600">{tool.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-[#0B3C6D] h-2 rounded-full" style={{ width: `${(tool.uses / 200) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12 text-right">{tool.uses}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Least Used Tools */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Least Used Tools</h3>
          <div className="space-y-4">
            {usageAnalytics.leastUsedTools.map((tool, index) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600">{tool.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${(tool.uses / 30) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12 text-right">{tool.uses}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Category Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {toolCategoryDistribution.map((cat) => (
            <div key={cat.name} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: cat.color }} />
              <p className="text-sm font-medium text-gray-800">{cat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{cat.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
