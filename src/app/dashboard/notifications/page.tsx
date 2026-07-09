'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ArrowRight, Clock, DollarSign, Package, RefreshCw } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from '@/hooks/api';
import type { Notification } from '@/lib/database.types';

const typeIcons: Record<string, React.ElementType> = {
  tool_request_created: Package,
  tool_request_approved: CheckCheck,
  tool_request_rejected: RefreshCw,
  tool_request_completed: Clock,
  financial_request_created: DollarSign,
  financial_request_approved: CheckCheck,
  financial_request_rejected: RefreshCw,
};

const typeColors: Record<string, string> = {
  tool_request_created: 'text-blue-600 bg-blue-100',
  tool_request_approved: 'text-green-600 bg-green-100',
  tool_request_rejected: 'text-red-600 bg-red-100',
  tool_request_completed: 'text-teal-600 bg-teal-100',
  financial_request_created: 'text-yellow-600 bg-yellow-100',
  financial_request_approved: 'text-green-600 bg-green-100',
  financial_request_rejected: 'text-red-600 bg-red-100',
};

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications(100);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutateAsync: markAllRead, isPending: markingAll } = useMarkAllNotificationsAsRead();
  const { mutateAsync: markRead } = useMarkNotificationAsRead();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifList = notifications as Notification[];
  const filtered = filter === 'unread' ? notifList.filter(n => !n.is_read) : notifList;

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'unread' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread {unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#0B3C6D] hover:bg-[#0B3C6D]/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unread' ? 'No unread notifications' : 'Notifications will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((n, i) => {
              const Icon = typeIcons[n.type] || Bell;
              const colorClass = typeColors[n.type] || 'text-gray-600 bg-gray-100';
              return (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-4 px-4 lg:px-6 py-4 hover:bg-gray-50 transition-colors ${
                    !n.is_read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#0B3C6D] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(n.created_at)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
