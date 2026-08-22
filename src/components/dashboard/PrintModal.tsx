'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Printer, Loader2 } from 'lucide-react';
import type { ToolRequest } from '@/lib/database.types';
import PrintReceipt from './PrintReceipt';

interface PrintModalProps {
  requestId: string | null;
  onClose: () => void;
}

export default function PrintModal({ requestId, onClose }: PrintModalProps) {
  const [printing, setPrinting] = useState(false);

  const { data: request, isLoading, isError } = useQuery<ToolRequest>({
    queryKey: ['tool-request', requestId],
    queryFn: async () => {
      const res = await fetch(`/api/tool-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('senexpert_token')}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Request not found');
      return json.data;
    },
    enabled: !!requestId && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
  });

  // Close on Escape
  useEffect(() => {
    if (!requestId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [requestId, onClose]);

  const handlePrint = () => {
    setPrinting(true);
    // Add printing class to body so @media print CSS can isolate the overlay
    document.body.classList.add('printing');
    // setTimeout gives React time to flush the class, then print dialog opens (blocks)
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing');
      setPrinting(false);
    }, 100);
  };

  if (!requestId) return null;

  return (
    <>
      {/* Print-specific styles that isolate the modal content */}
      <style>{`
        @page { margin: 10mm; size: A4 portrait; }
        @media print {
          html, body {
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          body.printing > * { visibility: hidden !important; }
          body.printing .print-overlay {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            z-index: 999999 !important;
            overflow: visible !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 10mm !important;
            display: block !important;
            box-sizing: border-box !important;
          }
          body.printing .print-overlay * { visibility: visible !important; }
          body.printing .print-overlay .no-print { display: none !important; }
          body.printing .print-overlay > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: block !important;
          }
          body.printing .print-overlay > div > div { padding: 0 !important; display: block !important; }
          body.printing .print-overlay .print-receipt {
            max-width: 100% !important;
            display: block !important;
            width: 100% !important;
          }
          body.printing .print-overlay .print-receipt table,
          body.printing .print-overlay .print-receipt tr,
          body.printing .print-overlay .print-receipt td,
          body.printing .print-overlay .print-receipt th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body.printing .print-overlay .signature-section {
            position: static !important;
            margin-top: 16px !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          body.printing .print-overlay .print-receipt input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            width: auto !important;
            box-shadow: none !important;
          }
          body.printing .print-overlay .print-receipt .print-only { display: block !important; }
          body.printing .print-overlay-backdrop { background: white !important; display: block !important; }
        }

        .print-receipt .print-only { display: none; }
        .print-receipt input { outline: none; }
        .print-receipt input:focus { border-color: #0B3C6D; box-shadow: 0 0 0 2px rgba(11,60,109,0.1); }
      `}</style>

      {/* Backdrop — print-overlay class on the outermost element */}
      <div className="print-overlay-backdrop print-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60">
        <div className="relative w-full max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-2xl">
          {/* Toolbar — hidden when printing */}
          <div className="no-print flex items-center justify-between sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 rounded-t-xl">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" /> Close
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50"
            >
              {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              Print
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#0B3C6D]" />
              </div>
            )}
            {isError && (
              <div className="text-center py-20">
                <p className="text-red-500 mb-2">Failed to load request</p>
                <button onClick={onClose} className="text-sm text-[#0B3C6D] hover:underline">Close</button>
              </div>
            )}
            {request && <PrintReceipt request={request} />}
          </div>
        </div>
      </div>
    </>
  );
}
