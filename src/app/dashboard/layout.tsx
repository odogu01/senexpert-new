'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, getCurrentUser, getProfile } from '@/services/authService';
import { type Profile, type UserRole } from '@/lib/supabase';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  // Check for mobile viewport
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
    async function checkAuth() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const profileResponse = await getProfile(user.id);
        
        if (!profileResponse.success || !profileResponse.data) {
          router.push('/login');
          return;
        }

        setProfile(profileResponse.data);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

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

  // For display purposes - use viewAsRole if set, otherwise use actual role
  const displayRole = viewAsRole || profile?.role || 'manager';
  const isSuperAdmin = profile?.role === 'super_admin';

  // Show loading state
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
      {/* Sidebar - Hidden on mobile, shown as overlay when open */}
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
      
      {/* Topbar - Always full width */}
      <Topbar 
        userRole={displayRole}
        actualRole={profile?.role}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={handleMenuClick}
        userName={profile?.full_name}
        avatarUrl={(profile as unknown as { avatar_url?: string }).avatar_url}
        isSuperAdmin={isSuperAdmin}
        viewAsRole={viewAsRole}
        onViewAsChange={handleViewAsChange}
      />
      
      {/* Main Content */}
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
