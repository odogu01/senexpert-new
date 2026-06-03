'use client';

import { QueryProvider } from '@/lib/query';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryProvider>{children}</QueryProvider>;
}