'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  index?: number;
  subtitle?: string;
}

const colorClasses = {
  blue: 'from-[#0B3C6D] to-[#1E6FBE]',
  green: 'from-green-500 to-green-600',
  orange: 'from-[#984307] to-[#B86B2A]',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

const iconColorClasses = {
  blue: 'bg-[#0B3C6D]/10 text-[#0B3C6D]',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-[#984307]/10 text-[#984307]',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue', index = 0, subtitle }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Metric Card Component (simpler version)
// ============================================

interface MetricCardProps {
  label: string;
  value: number | string;
  color?: 'default' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
}

const metricColors = {
  default: 'text-gray-800',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
};

export function MetricCard({ label, value, color = 'default', icon: Icon }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg ${iconColorClasses[color as keyof typeof iconColorClasses] || 'bg-gray-100 text-gray-600'}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold ${metricColors[color]}`}>{value}</p>
      </div>
    </div>
  );
}
