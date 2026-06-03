'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToolRequests } from '@/hooks/api';
import type { ToolRequest } from '@/lib/database.types';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintToolRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { data: requests = [], isLoading } = useToolRequests();

  const request = (requests as ToolRequest[]).find(r => r.id === params.id);

  useEffect(() => { document.title = 'Tool Request - SenExpert'; }, []);

  const handlePrint = () => { window.focus(); window.print(); };
  const handleBack = () => { router.push('/dashboard/requests'); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]" />
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

  const r = request as unknown as Record<string, string>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <style>{`
        @page { margin: 15mm; size: A4 portrait; }
        @media print {
          body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-4 mb-8 no-print">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0B3C6D]/90"><Printer className="w-4 h-4" /> Print</button>
      </div>

      {/* Print Content */}
      <div className="print-area max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center border-b border-gray-300 pb-6 mb-6">
          <img src="/title-logo.png" alt="SenExpert Global" className="w-20 h-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">SenExpert Global Energies</h1>
          <p className="text-sm text-gray-500">Tool Request Receipt</p>
        </div>

        {/* Request Information */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Request Information</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Request ID</span>
              <span className="text-sm text-gray-900">#{request.id.slice(0, 8)}</span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Tool</span>
              <span className="text-sm text-gray-900">{request.tool_name || 'N/A'}</span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Movement Type</span>
              <span className={`text-sm font-medium ${request.movement_type === 'incoming' ? 'text-green-600' : 'text-blue-600'}`}>
                {request.movement_type === 'incoming' ? 'Incoming' : 'Outgoing'}
              </span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Transaction Type</span>
              <span className="text-sm text-gray-900">{r.transaction_type || '-'}</span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Quantity</span>
              <span className="text-sm font-semibold text-gray-900">{request.quantity}</span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Status</span>
              <span className={`text-sm font-medium capitalize ${
                request.status === 'approved' ? 'text-green-600' :
                request.status === 'rejected' ? 'text-red-600' :
                request.status === 'completed' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>{request.status}</span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Location</span>
              <span className="text-sm text-gray-900">{r.location || '-'}</span>
            </div>
            {request.notes && (
              <div className="flex items-center border-b border-gray-100 pb-2 col-span-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Notes</span>
                <span className="text-sm text-gray-900">{request.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery/Receiving Information */}
        {request.movement_type === 'outgoing' && (
          <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Delivery Information</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Vehicle No</span>
                <span className="text-sm text-gray-900">{r.vehicle_no || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Delivered To</span>
                <span className="text-sm text-gray-900">{r.delivered_to || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Delivered By</span>
                <span className="text-sm text-gray-900">{r.delivered_by || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Received By</span>
                <span className="text-sm text-gray-900">{r.received_by || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Received From</span>
                <span className="text-sm text-gray-900">{r.received_from || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {request.movement_type === 'incoming' && (
          <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Receiving Information</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Vehicle No</span>
                <span className="text-sm text-gray-900">{r.vehicle_no || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Received By</span>
                <span className="text-sm text-gray-900">{r.received_by || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Received From</span>
                <span className="text-sm text-gray-900">{r.received_from || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Delivered To</span>
                <span className="text-sm text-gray-900">{r.delivered_to || '-'}</span>
              </div>
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Delivered By</span>
                <span className="text-sm text-gray-900">{r.delivered_by || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Approval Timeline */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Approval Timeline</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Created</span>
              <span className="text-sm text-gray-900">
                {request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB') : '-'}
              </span>
            </div>
            <div className="flex items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-semibold text-gray-500 w-32">Requested By</span>
              <span className="text-sm text-gray-900">{r.requested_by || 'Unknown'}</span>
            </div>
            {r.approved_by && (
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Approved By</span>
                <span className="text-sm text-gray-900">{r.approved_by}</span>
              </div>
            )}
            {r.approved_at && (
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Approved At</span>
                <span className="text-sm text-gray-900">{new Date(r.approved_at).toLocaleDateString('en-GB')}</span>
              </div>
            )}
            {request.completed_at && (
              <div className="flex items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-gray-500 w-32">Completed At</span>
                <span className="text-sm text-gray-900">{new Date(request.completed_at).toLocaleDateString('en-GB')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Generated by SenExpert Global Energies - SGE System</p>
        </div>
      </div>
    </div>
  );
}
