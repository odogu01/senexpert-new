'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, Wrench, Plus, AlertTriangle, Truck, Package } from 'lucide-react';
import type { AuditLog } from '@/lib/database.types';

interface ActivityFeedProps {
  maxItems?: number;
}

const activityIcons: Record<string, typeof Package> = {
  INSERT: Plus,
  UPDATE: Wrench,
  DELETE: AlertTriangle,
  checkout: ArrowDownToLine,
  checkin: ArrowUpFromLine,
  maintenance: Wrench,
  added: Plus,
  damaged: AlertTriangle,
  transfer: Truck,
};

const activityColors: Record<string, string> = {
  INSERT: 'bg-[#0B3C6D]/10 text-[#0B3C6D]',
  UPDATE: 'bg-blue-100 text-blue-600',
  DELETE: 'bg-red-100 text-red-600',
  checkout: 'bg-blue-100 text-blue-600',
  checkin: 'bg-green-100 text-green-600',
  maintenance: 'bg-purple-100 text-purple-600',
  added: 'bg-[#0B3C6D]/10 text-[#0B3C6D]',
  damaged: 'bg-red-100 text-red-600',
  transfer: 'bg-yellow-100 text-yellow-600',
};

function formatTimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityFeed({ maxItems = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const token = localStorage.getItem('senexpert_token');
      if (!token) return;

      const response = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setActivities(data.data.slice(0, maxItems));
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  }

  const getActivityDescription = (log: AuditLog): string => {
    const action = log.action || 'Unknown';
    const table = log.table_name || 'System';
    
    if (action === 'INSERT') {
      return `New ${table.slice(0, -1)} added to system`;
    }
    if (action === 'UPDATE') {
      return `${table.slice(0, -1)} was updated`;
    }
    if (action === 'DELETE') {
      return `${table.slice(0, -1)} was removed`;
    }
    return `${action} on ${table}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B3C6D] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        <button className="text-sm text-[#0B3C6D] hover:underline">View All</button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Activities will appear here when actions are performed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.action || 'Unknown'] || Package;
              const colorClass = activityColors[activity.action || 'Unknown'] || 'bg-gray-100 text-gray-600';
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{getActivityDescription(activity)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatTimestamp(activity.created_at || new Date().toISOString())}</span>
                        {activity.table_name && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-400">{activity.table_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}