'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X, Bell } from 'lucide-react';
import type { Alert } from '@/lib/database.types';

interface AlertsPanelProps {
  alerts?: Alert[];
  maxItems?: number;
}

const alertStyles: Record<string, { bg: string; border: string; icon: string; title: string; description: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'bg-red-100 text-red-600',
    title: 'text-red-800',
    description: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'bg-yellow-100 text-yellow-600',
    title: 'text-yellow-800',
    description: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    title: 'text-blue-800',
    description: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    title: 'text-green-800',
    description: 'text-green-600',
  },
};

const alertIcons: Record<string, typeof Info> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: Info,
};

export default function AlertsPanel({ maxItems = 5 }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const { getAlerts } = await import('@/services/toolsService');
      const response = await getAlerts(false);
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  const displayedAlerts = alerts.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Alerts & Notifications</h3>
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
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Alerts & Notifications</h3>
          {displayedAlerts.filter(a => a.type === 'critical').length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
              {displayedAlerts.filter(a => a.type === 'critical').length} Critical
            </span>
          )}
        </div>
        <button className="text-sm text-[#0B3C6D] hover:underline">View All</button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {displayedAlerts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No alerts at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayedAlerts.map((alert, index) => {
              const style = alertStyles[alert.type] || alertStyles.info;
              const Icon = alertIcons[alert.type] || Info;
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`px-6 py-4 ${style.bg} border-l-4 ${style.border} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${style.title}`}>{alert.title}</p>
                      {alert.description && (
                        <p className={`text-xs mt-1 ${style.description}`}>{alert.description}</p>
                      )}
                      {alert.category && (
                        <p className="text-xs text-gray-400 mt-1">
                          Category: <span className="font-medium">{alert.category}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
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