'use client';

import { motion } from 'framer-motion';

type Status = 'available' | 'in_use' | 'maintenance' | 'damaged' | 'lost' | 'retired' | 'rentals' | 'sold' | 'pending' | 'approved' | 'rejected' | 'added' | 'scheduled' | 'repair' | 'inspection' | 'completed' | 'in_progress' | 'cancelled';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  // Tool statuses
  available: { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' },
  in_use: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Use' },
  maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Maintenance' },
  damaged: { bg: 'bg-red-100', text: 'text-red-700', label: 'Damaged' },
  lost: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Lost' },
  retired: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Retired' },
  rentals: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Rentals' },
  sold: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Sold' },
  
  // Request statuses
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  
  added: { bg: 'bg-[#0B3C6D]/10', text: 'text-[#0B3C6D]', label: 'Added' },
  
  // Maintenance statuses
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
  repair: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Repair' },
  inspection: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Inspection' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'available' ? 'bg-green-500' : status === 'in_use' ? 'bg-blue-500' : status === 'maintenance' ? 'bg-yellow-500' : status === 'damaged' || status === 'lost' || status === 'rejected' ? 'bg-red-500' : status === 'added' ? 'bg-[#0B3C6D]' : 'bg-gray-500'}`} />
      {config.label}
    </motion.span>
  );
}

// ============================================
// Progress Bar Component
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const progressColors = {
  blue: 'bg-[#0B3C6D]',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

const progressSizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({ value, max = 100, color = 'blue', showLabel = false, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">{value}</span>
          <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${progressSizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${progressColors[color]}`}
        />
      </div>
    </div>
  );
}
