import { AuthProvider } from '@/lib/authContext';
import { QueryProvider } from '@/lib/query';
import DashboardShell from './DashboardShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <DashboardShell>{children}</DashboardShell>
      </AuthProvider>
    </QueryProvider>
  );
}
