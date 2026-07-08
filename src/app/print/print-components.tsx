'use client';

import { Printer } from 'lucide-react';

export function PrintToolbar() {
  return (
    <div className="no-print" style={{ textAlign: 'center', marginBottom: '32px' }}>
      <button
        onClick={() => { window.focus(); window.print(); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 24px', background: '#0B3C6D', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px',
        }}
      >
        <Printer className="w-4 h-4" /> Print
      </button>
    </div>
  );
}

export function PrintHeader({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', borderBottom: '1px solid #d1d5db', paddingBottom: '24px', marginBottom: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>SenExpert Global Energies</h1>
      <p style={{ fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>
    </div>
  );
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
      {children}
    </div>
  );
}

export function InfoRow({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6',
        paddingBottom: '8px', gridColumn: colSpan === 2 ? '1 / -1' : undefined,
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', width: '120px', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: '#111827' }}>{value}</span>
    </div>
  );
}
