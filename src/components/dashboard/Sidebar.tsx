'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  RotateCcw, 
  Wrench, 
  BarChart3, 
  Calendar, 
  FileText, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
  X,
  DollarSign
} from 'lucide-react';
import type { UserRole } from '@/lib/supabase';

interface SidebarProps {
  userRole?: UserRole;
  collapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// Navigation items with icons and labels
const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Requests', href: '/dashboard/requests', icon: RotateCcw, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Financial Requests', href: '/dashboard/financial-requests', icon: DollarSign, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['super_admin', 'admin', 'hr', 'manager'] },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: ClipboardList, roles: ['super_admin'] },
  { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['super_admin', 'admin'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin'] },
];

export default function Sidebar({ userRole = 'manager', collapsed = false, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Filter items based on user role
  const visibleNavItems = navItems.filter(item => 
    item.roles.includes(userRole as UserRole)
  );

  // Handle navigation click on mobile
  const handleNavClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  // On mobile, always show expanded (with text)
  // On desktop, check collapsed state
  const showExpanded = isMobile ? true : !collapsed;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0B3C6D] to-[#00AEEF] rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {showExpanded && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-[#0B3C6D] text-lg"
            >
              ToolVault
            </motion.span>
          )}
        </Link>
        
        {/* Mobile close button */}
        {isMobile && (
          <button 
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2 lg:px-3">
          {visibleNavItems.map((item) => {
            // Check if current page matches this nav item
            // For /dashboard, use exact match (not startsWith to avoid matching /dashboard/users etc.)
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#0B3C6D]/10 to-[#00AEEF]/10 text-[#0B3C6D]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#0B3C6D]'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-gradient-to-b from-[#0B3C6D] to-[#00AEEF] rounded-r-full"
                    />
                  )}
                  
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#0B3C6D]' : 'text-gray-400 group-hover:text-[#0B3C6D]'}`} />
                  
                  {showExpanded && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-sm font-medium whitespace-nowrap ${isActive ? 'text-[#0B3C6D]' : ''}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle - Desktop only */}
      {!isMobile && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-[#0B3C6D] hover:bg-gray-50 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </>
  );

  // Mobile: overlay + slide-in
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onMobileClose}
            />
          )}
        </AnimatePresence>
        
        {/* Sidebar */}
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: isMobileOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed left-0 top-0 h-full w-72 bg-white z-50 lg:hidden flex flex-col`}
        >
          {sidebarContent}
        </motion.aside>
      </>
    );
  }

  // Desktop: normal sidebar
  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 hidden lg:flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {sidebarContent}
    </aside>
  );
}
