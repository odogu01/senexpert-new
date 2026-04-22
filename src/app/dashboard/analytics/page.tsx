'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Package, Clock, AlertTriangle } from 'lucide-react';
import { getToolsApi, getDashboardStatsApi } from '@/lib/apiClient';
import type { Tool } from '@/lib/database.types';

interface Stats {
  totalTools: number;
  available: number;
  inUse: number;
  maintenance: number;
  lowStock: number;
}

interface UsageTool {
  name: string;
  uses: number;
}

export default function AnalyticsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [toolsRes, statsRes] = await Promise.all([
        getToolsApi(),
        getDashboardStatsApi()
      ]);
      
      if (toolsRes.success && toolsRes.data) {
        setTools(toolsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate analytics from real data
  const totalTools = stats?.totalTools || 0;
  const utilizationRate = totalTools > 0 ? Math.round((stats?.inUse || 0) / totalTools * 100) : 0;
  const averageDowntime = 3.2; // Could calculate from maintenance data
  const downtimeRate = totalTools > 0 ? Math.round((stats?.maintenance || 0) / totalTools * 100 * 10) / 10 : 0;

  // Most used tools (by status = in_use)
  const toolUsage: UsageTool[] = tools
    .filter(t => t.status === 'in_use')
    .slice(0, 5)
    .map(t => ({ name: t.name, uses: t.quantity }));

  // If not enough in_use tools, fill with available
  if (toolUsage.length < 5) {
    const availableTools = tools
      .filter(t => t.status === 'available')
      .slice(0, 5 - toolUsage.length)
      .map(t => ({ name: t.name, uses: 0 }));
    toolUsage.push(...availableTools);
  }

  // Least used tools (by quantity - lower is less used)
  const leastUsedTools: UsageTool[] = [...tools]
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
    .map(t => ({ name: t.name, uses: t.quantity }));

  // Category distribution
  const categoryMap = new Map<string, number>();
  tools.forEach(tool => {
    const current = categoryMap.get(tool.category) || 0;
    categoryMap.set(tool.category, current + tool.quantity);
  });
  const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  
  const colors = ['#0B3C6D', '#00AEEF', '#FF6B35', '#4CAF50', '#9C27B0'];
  const categoryDistribution: { name: string; value: number; color: string }[] = Array.from(categoryMap.entries()).map(([name, value], index) => ({
    name,
    value: total > 0 ? Math.round((value / total) * 100) : 0,
    color: colors[index % colors.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

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
              <p className="text-lg lg:text-2xl font-bold text-gray-800">{utilizationRate}%</p>
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
              <p className="text-2xl font-bold text-gray-800">{averageDowntime} days</p>
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
              <p className="text-2xl font-bold text-gray-800">{stats?.inUse || 0}</p>
              <p className="text-sm text-gray-500">Tools In Use</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{downtimeRate}%</p>
              <p className="text-sm text-gray-500">Downtime Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Tools */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Tools In Use</h3>
          <div className="space-y-4">
            {toolUsage.length > 0 ? toolUsage.map((tool, index) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#0B3C6D]/10 text-[#0B3C6D] rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600">{tool.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-[#0B3C6D] h-2 rounded-full" style={{ width: `${Math.min((tool.uses / 50) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12 text-right">{tool.uses}</span>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No tools in use</p>
            )}
          </div>
        </div>

        {/* Least Used Tools */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Available Tools</h3>
          <div className="space-y-4">
            {leastUsedTools.length > 0 ? leastUsedTools.map((tool, index) => (
              <div key={tool.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-600">{tool.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${Math.min((tool.uses / 50) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 w-12 text-right">{tool.uses}</span>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No tools available</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Category Distribution</h3>
        {categoryDistribution.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {categoryDistribution.map((cat, idx) => (
              <div key={cat.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-2" 
                  style={{ 
                    backgroundColor: ['#0B3C6D', '#00AEEF', '#FF6B35', '#4CAF50', '#9C27B0'][idx % 5] 
                  }} 
                />
                <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{cat.value}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No category data available</p>
        )}
      </div>
    </div>
  );
}