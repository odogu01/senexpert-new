'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Plus,
  Search,
  LogOut as LogOutIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/database.types';
import type { Alert } from '@/lib/database.types';

interface TopbarProps {
  userRole?: UserRole;
  actualRole?: UserRole;
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
  avatarUrl?: string;
  userName?: string;
  isSuperAdmin?: boolean;
  viewAsRole?: UserRole | null;
  onViewAsChange?: (role: UserRole | null) => void;
}

const roleDisplayNames: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  hr: 'HR Manager',
  manager: 'Team Manager',
  operator: 'Operator',
};

export default function Topbar({ 
  userRole = 'manager', 
  actualRole,
  sidebarCollapsed = false, 
  onMenuClick, 
  avatarUrl, 
  userName: propUserName,
  isSuperAdmin = false,
  viewAsRole,
  onViewAsChange,
}: TopbarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [userName, setUserName] = useState(propUserName || 'User');
  const [avatar, setAvatar] = useState(avatarUrl || '');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // For display - show viewAsRole if set, otherwise actualRole
  const displayRole = viewAsRole || actualRole || userRole;
  const isViewingAsAnother = viewAsRole && viewAsRole !== actualRole;
  const actualRoleLabel = actualRole ? roleDisplayNames[actualRole] : roleDisplayNames[userRole];

  // Set initial values from props
  useEffect(() => {
    if (propUserName) {
      setUserName(propUserName);
    }
    if (avatarUrl) {
      setAvatar(avatarUrl);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsMobileProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsMobileNotificationsOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Load alerts from API
  useEffect(() => {
    async function loadAlerts() {
      try {
        const token = localStorage.getItem('senexpert_token');
        const response = await fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data) {
          setAlerts(data.data);
        }
      } catch (error) {
        console.error('Failed to load alerts:', error);
      }
    }
    loadAlerts();
  }, []);

  const [alerts, setAlerts] = useState<Alert[]>([]);

  const unreadAlerts = alerts.filter(a => a.type === 'critical' || a.type === 'warning').length;

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-2 lg:px-6"
    >
      {/* Mobile Left - Menu Button */}
      <div className="flex items-center lg:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Desktop Menu Button - Hidden on mobile */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 hidden lg:block"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Search Bar - Desktop */}
      <div className="hidden lg:flex flex-1 max-w-md ml-64">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools, requests, users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D] transition-all"
          />
        </div>
      </div>

      {/* Mobile Right Section - Search, Bell, Profile */}
      <div className="flex items-center gap-1 lg:hidden">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => {
            setIsMobileSearchOpen(!isMobileSearchOpen);
            setIsMobileNotificationsOpen(false);
            setIsMobileProfileOpen(false);
          }}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {isMobileSearchOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Search className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Notifications - Mobile */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsMobileNotificationsOpen(!isMobileNotificationsOpen);
              setIsMobileSearchOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className="relative p-2 text-gray-600 hover:text-[#0B3C6D] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isMobileNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed left-2 right-2 top-[4.5rem] max-w-sm mx-auto bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          alert.type === 'critical' ? 'bg-red-500' : 
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/notifications" className="block px-4 py-2 text-sm text-center text-[#0B3C6D] hover:bg-gray-50 border-t border-gray-100">
                  View All Notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown - Mobile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsMobileProfileOpen(!isMobileProfileOpen);
              setIsMobileSearchOpen(false);
              setIsMobileNotificationsOpen(false);
            }}
            className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0B3C6D] to-[#00AEEF] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
          </button>

          <AnimatePresence>
            {isMobileProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed left-2 right-2 top-[4.5rem] max-w-sm mx-auto bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800 capitalize">{userName}</p>
                  <p className="text-xs text-gray-500">{actualRoleLabel}</p>
                  {isViewingAsAnother && (
                    <p className="text-xs text-blue-600 mt-1">
                      (Viewing as {roleDisplayNames[viewAsRole]})
                    </p>
                  )}
                </div>
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Search Input - Shows when clicked */}
      {isMobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-3 lg:hidden z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools, requests, users..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20 focus:border-[#0B3C6D]"
            />
          </div>
        </div>
      )}

      {/* Right Section - Desktop */}
      <div className={`hidden lg:flex items-center gap-3`}>
        {/* Quick Actions - Hidden on mobile */}
        <div className="hidden lg:block relative" ref={quickActionsRef}>
          <button
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white text-sm font-medium rounded-lg hover:bg-[#0a325a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick Actions
            <ChevronDown className={`w-4 h-4 transition-transform ${isQuickActionsOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isQuickActionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <Link href="/dashboard/inventory?action=add" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 text-[#0B3C6D]" />
                  Add New Tool
                </Link>
                <Link href="/dashboard/inventory?action=assign" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-[#00AEEF]" />
                  Assign Tool
                </Link>
                <Link href="/dashboard/maintenance?action=schedule" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-[#984307]" />
                  Schedule Maintenance
                </Link>
                <Link href="/dashboard/calendar?action=create" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 text-[#B86B2A]" />
                  Create Meeting
                </Link>
                <Link href="/dashboard/reports?action=generate" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 text-[#1E6FBE]" />
                  Generate Reports
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications - Desktop */}
        <div className="relative" ref={(el) => { if (el) notificationsRef.current = el; }}>
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsMobileNotificationsOpen(false);
            }}
            className="relative p-2 text-gray-600 hover:text-[#0B3C6D] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          alert.type === 'critical' ? 'bg-red-500' : 
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/notifications" className="block px-4 py-2 text-sm text-center text-[#0B3C6D] hover:bg-gray-50 border-t border-gray-100">
                  View All Notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown - Desktop */}
        <div className="relative" ref={(el) => { if (el) profileRef.current = el; }}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsMobileProfileOpen(false);
            }}
            className="flex items-center gap-2 lg:pl-3 lg:pr-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0B3C6D] to-[#00AEEF] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 capitalize">{userName}</p>
              <div>
                <p className="text-xs text-gray-500">{actualRoleLabel}</p>
                {isViewingAsAnother && (
                  <p className="text-xs text-blue-600">Viewing as {roleDisplayNames[viewAsRole]}</p>
                )}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800 capitalize">{userName}</p>
                  <p className="text-xs text-gray-500">{roleDisplayNames[userRole]}</p>
                </div>
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
