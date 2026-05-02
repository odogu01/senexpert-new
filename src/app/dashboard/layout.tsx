'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getStoredUser, getStoredProfile } from '@/lib/authContext';
import type { UserRole } from '@/lib/database.types';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      const storedUser = getStoredUser();
      const storedProfile = getStoredProfile();
      
      if (!storedUser || !storedProfile) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleViewAsChange = (role: UserRole | null) => {
    setViewAsRole(role);
  };

  // Get avatar directly from localStorage to ensure we have the latest
  const getStoredProfileData = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('senexpert_profile');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };
  
  const storedProfileData = getStoredProfileData();
  const profileAvatar = storedProfileData?.avatar_url || '';

  const displayRole = viewAsRole || profile?.role || 'field';
  const isSuperAdmin = profile?.role === 'super_admin';

  if (isLoading || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0B3C6D',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        userRole={displayRole} 
        actualRole={profile?.role}
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={handleMobileMenuClose}
        isSuperAdmin={isSuperAdmin}
        viewAsRole={viewAsRole}
        onViewAsChange={handleViewAsChange}
      />
      
      <Topbar 
        userRole={displayRole}
        actualRole={profile?.role}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={handleMenuClick}
        userName={profile?.full_name}
        avatarUrl={profileAvatar}
        isSuperAdmin={isSuperAdmin}
        viewAsRole={viewAsRole}
        onViewAsChange={handleViewAsChange}
      />
      
      <main 
        className={`pt-20 pb-8 transition-all duration-300 ${
          isMobile ? 'pl-0' : (sidebarCollapsed ? 'pl-20' : 'pl-64')
        }`}
      >
        <div className="px-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}