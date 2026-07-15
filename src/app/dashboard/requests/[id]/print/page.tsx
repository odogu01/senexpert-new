'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ToolRequest } from '@/lib/database.types';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import PrintReceipt from '@/components/dashboard/PrintReceipt';

export default function PrintToolRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: request, isLoading } = useQuery<ToolRequest>({
    queryKey: ['tool-request', id],
    queryFn: async () => {
      const res = await fetch(`/api/tool-requests/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('senexpert_token')}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Request not found');
      return json.data;
    },
    enabled: !!id && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });

  useEffect(() => { document.title = 'Tool Request - SenExpert'; }, []);

  const handlePrint = () => {
    window.focus();
    window.print();
  };
  const handleBack = () => { router.push('/dashboard/requests'); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3C6D]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found</p>
          <button onClick={() => router.push('/dashboard/requests')} className="px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]">Back to Requests</button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page-wrapper p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <style>{`
        @page { margin: 8mm; size: A4 portrait; }
        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page-wrapper {
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .no-print { display: none !important; }
          .print-receipt {
            padding: 0 !important;
            max-width: 100% !important;
            min-height: calc(297mm - 45mm);
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-receipt table,
          .print-receipt tr,
          .print-receipt td,
          .print-receipt th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-section {
            margin-top: auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-receipt input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            width: auto !important;
            box-shadow: none !important;
            border-bottom: 1px solid #000 !important;
          }
          .print-receipt .print-only { display: block !important; }
        }
        .print-receipt .print-only { display: none; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-4 mb-8 no-print">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]"><Printer className="w-4 h-4" /> Print</button>
      </div>

      <PrintReceipt request={request} />
    </div>
  );
}
