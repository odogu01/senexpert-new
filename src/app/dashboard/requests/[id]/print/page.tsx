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

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white print-page">
      <style>{`
        @page { margin: 0; size: A4; }
        @media print {
          body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-content { box-shadow: none !important; border: none !important; }
        }
      `}</style>
      <div className="mb-8 text-center print-hidden">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mx-auto"><ArrowLeft className="w-5 h-5" /> Back</button>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0B3C6D]/90 mx-auto mt-2"><Printer className="w-5 h-5" /> Print</button>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8 print-content">
        <div className="text-center mb-8 pb-4 border-b">
          <img src="/title-logo.png" alt="SenExpert Global" className="w-20 h-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0B3C6D]">Tool Request</h1>
          <p className="text-gray-500">Request ID: {request.id}</p>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div><label className="text-sm font-medium text-gray-500">Tool</label><p className="text-lg font-semibold">{request.tool_name || 'N/A'}</p></div>
            <div><label className="text-sm font-medium text-gray-500">Movement Type</label><p className={`text-lg font-semibold ${request.movement_type === 'incoming' ? 'text-green-600' : 'text-blue-600'}`}>{request.movement_type === 'incoming' ? 'Incoming' : 'Outgoing'}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="text-sm font-medium text-gray-500">Quantity</label><p className="text-lg font-semibold">{request.quantity}</p></div>
            <div><label className="text-sm font-medium text-gray-500">Status</label><p className={`capitalize text-lg font-semibold ${request.status === 'approved' ? 'text-green-600' : request.status === 'rejected' ? 'text-red-600' : request.status === 'completed' ? 'text-blue-600' : 'text-yellow-600'}`}>{request.status}</p></div>
          </div>
          <div><label className="text-sm font-medium text-gray-500">Location</label><p className="text-gray-900">{(request as unknown as Record<string, string>).location || '-'}</p></div>
          {request.notes && <div><label className="text-sm font-medium text-gray-500">Notes</label><p className="text-gray-700">{request.notes}</p></div>}
          {request.movement_type === 'outgoing' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-500">Vehicle No</label><p className="text-gray-900">{(request as unknown as Record<string, string>).vehicle_no || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Delivered To</label><p className="text-gray-900">{(request as unknown as Record<string, string>).delivered_to || '-'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-500">Delivered By</label><p className="text-gray-900">{(request as unknown as Record<string, string>).delivered_by || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Received By</label><p className="text-gray-900">{(request as unknown as Record<string, string>).received_by || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Received From</label><p className="text-gray-900">{(request as unknown as Record<string, string>).received_from || '-'}</p></div>
              </div>
            </>
          )}
          {request.movement_type === 'incoming' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-500">Vehicle No</label><p className="text-gray-900">{(request as unknown as Record<string, string>).vehicle_no || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Received By</label><p className="text-gray-900">{(request as unknown as Record<string, string>).received_by || '-'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-500">Received From</label><p className="text-gray-900">{(request as unknown as Record<string, string>).received_from || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Delivered To</label><p className="text-gray-900">{(request as unknown as Record<string, string>).delivered_to || '-'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Delivered By</label><p className="text-gray-900">{(request as unknown as Record<string, string>).delivered_by || '-'}</p></div>
              </div>
            </>
          )}
        </div>
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</span>
            <span>Requested By: {request.requested_by || 'Unknown'}</span>
          </div>
          {request.approved_by && (
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Approved By: {request.approved_by}</span>
              <span>Approved At: {request.approved_at ? new Date(request.approved_at).toLocaleDateString() : '-'}</span>
            </div>
          )}
          {request.completed_at && (
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Completed By: System</span>
              <span>Completed At: {new Date(request.completed_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
