'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle, Clock, Wrench, AlertTriangle, FolderOpen, TrendingUp, DollarSign, FileCheck } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import StatusBadge, { ProgressBar } from '@/components/dashboard/StatusBadge';
import { useDashboardStats, useAlerts, useTools } from '@/hooks/api';

interface CategoryData {
  name: string;
  value: number;
  tools: number;
}

interface StatusData {
  name: string;
  value: number;
  count: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: alerts } = useAlerts();
  const { data: toolsData } = useTools();

  // Derive status distribution from stats
  const statusDistribution = useMemo<StatusData[]>(() => {
    if (!stats) return [];
    const total = stats.available + stats.inUse + stats.maintenance;
    if (total === 0) return [];
    return [
      { name: 'Available', value: Math.round((stats.available / total) * 100), count: stats.available },
      { name: 'In Use', value: Math.round((stats.inUse / total) * 100), count: stats.inUse },
      { name: 'Maintenance', value: Math.round((stats.maintenance / total) * 100), count: stats.maintenance },
    ];
  }, [stats]);

  // Derive category distribution from tools list
  const categories = useMemo<CategoryData[]>(() => {
    if (!toolsData || toolsData.length === 0) return [];
    const map = new Map<string, number>();
    for (const tool of toolsData) {
      map.set(tool.category, (map.get(tool.category) || 0) + tool.quantity);
    }
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([name, qty]) => ({
        name,
        value: total > 0 ? Math.round((qty / total) * 100) : 0,
        tools: qty,
      }))
      .sort((a, b) => b.tools - a.tools);
  }, [toolsData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]" />
      </div>
    );
  }

  const totalToolsCount = stats.available + stats.inUse + stats.maintenance;
  const availablePercentage = totalToolsCount > 0 ? Math.round((stats.available / totalToolsCount) * 100) : 0;
  const inUsePercentage = totalToolsCount > 0 ? Math.round((stats.inUse / totalToolsCount) * 100) : 0;
  const maintenancePercentage = totalToolsCount > 0 ? Math.round((stats.maintenance / totalToolsCount) * 100) : 0;

  const statCards = [
    { title: 'Total Tools', value: stats.totalTools, icon: Package, color: 'blue' as const, subtitle: `${totalToolsCount} items in stock` },
    { title: 'Available', value: stats.available, icon: CheckCircle, color: 'green' as const, subtitle: `${availablePercentage}% of total` },
    { title: 'In Use', value: stats.inUse, icon: Clock, color: 'blue' as const, subtitle: `${inUsePercentage}% of total` },
    { title: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'orange' as const, subtitle: `${maintenancePercentage}% of total` },
    { title: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'red' as const, subtitle: 'Items below minimum' },
    { title: 'Pending Requests', value: stats.pendingRequests, icon: FolderOpen, color: 'purple' as const, subtitle: 'Tool requests awaiting' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Welcome back! Here&apos;s what&apos;s happening with your tool inventory.</p>
        </div>
        <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
          <span>Last updated:</span>
          <span className="font-medium text-gray-700">Today, {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Financial Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Financial</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingFinancialRequests}</p>
              <p className="text-yellow-100 text-xs mt-1">requests awaiting approval</p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved Financial</p>
              <p className="text-3xl font-bold mt-1">{stats.approvedFinancialRequests}</p>
              <p className="text-green-100 text-xs mt-1">requests approved</p>
            </div>
            <FileCheck className="w-12 h-12 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#0B3C6D] to-[#00AEEF] rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Approved Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalFinancialAmount)}</p>
              <p className="text-blue-100 text-xs mt-1">total budget approved</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed maxItems={8} />
        </div>
        <div className="lg:col-span-1">
          <AlertsPanel alerts={alerts ?? []} maxItems={5} />
        </div>
      </div>

      {/* Tool Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Tool Status Distribution</h3>
          <div className="space-y-4">
            {statusDistribution.map((s) => (
              <div key={s.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{s.name}</span>
                  <span className="font-medium text-gray-800">{s.count} ({s.value}%)</span>
                </div>
                <ProgressBar value={s.value} max={100} color={s.name === 'Available' ? 'green' : s.name === 'In Use' ? 'blue' : 'orange'} size="md" />
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tools</span>
                <span className="font-bold text-gray-800">{totalToolsCount}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Tools by Category</h3>
          <div className="space-y-4">
            {categories.length > 0 ? categories.slice(0, 6).map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="font-medium text-gray-800">{cat.tools} ({cat.value}%)</span>
                </div>
                <ProgressBar value={cat.value} max={100} color="blue" size="sm" />
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No tools in inventory yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
