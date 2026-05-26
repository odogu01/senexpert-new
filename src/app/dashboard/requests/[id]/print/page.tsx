'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/authContext';
import { getToolRequestsApi } from '@/lib/apiClient';
import type { ToolRequest } from '@/lib/database.types';
import { Printer, ArrowLeft, Package, Filter, Clock, User, Wrench, Calendar, CheckCircle, XCircle } from 'lucide-react';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('senexpert_token');
}

function getCurrentUserFromStorage() {
  const userStr = localStorage.getItem('senexpert_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export default function PrintToolRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<ToolRequest | null>(null);

  useEffect(() => {
    loadRequest();
  }, [params.id]);

  async function loadRequest() {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const user = getCurrentUserFromStorage();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await getToolRequestsApi();
      if (response.success && response.data) {
        const foundRequest = response.data.find((r: ToolRequest) => r.id === params.id);
        if (foundRequest) {
          setRequest(foundRequest);
        } else {
          router.push('/dashboard/requests');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load request:', error);
      router.push('/dashboard/requests');
      return;
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Request not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0B3C6D]/90"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
      </div>

       <div className="bg-white rounded-lg shadow-lg p-8 print-bg-white print-shadow-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0B3C6D]">Tool Request</h1>
          <p className="text-gray-500">Request ID: {request.id}</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Tool</label>
              <p className="text-lg font-semibold">{request.tool_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Movement Type</label>
              <p className={`text-lg font-semibold ${
                request.movement_type === 'incoming' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {request.movement_type === 'incoming' ? 'Incoming' : 'Outgoing'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Quantity</label>
              <p className="text-lg font-semibold">{request.quantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className={`capitalize text-lg font-semibold ${
                request.status === 'approved' ? 'text-green-600' :
                request.status === 'rejected' ? 'text-red-600' :
                request.status === 'completed' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {request.status}
              </p>
            </div>
          </div>

           <div>
             <label className="text-sm font-medium text-gray-500">Location</label>
             <p className="text-gray-900">
               {(request as any).location || '-'}
             </p>
           </div>

          {request.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-gray-700">{request.notes}</p>
            </div>
          )}

           {request.movement_type === 'outgoing' && (
             <>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Vehicle No</label>
                   <p className="text-gray-900">
                     {(request as any).vehicle_no || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Delivered To</label>
                   <p className="text-gray-900">
                     {(request as any).delivered_to || '-'}
                   </p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Delivered By</label>
                   <p className="text-gray-900">
                     {(request as any).delivered_by || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Received By</label>
                   <p className="text-gray-900">
                     {(request as any).received_by || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Received From</label>
                   <p className="text-gray-900">
                     {(request as any).received_from || '-'}
                   </p>
                 </div>
               </div>
             </>
           )}

           {request.movement_type === 'incoming' && (
             <>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Vehicle No</label>
                   <p className="text-gray-900">
                     {(request as any).vehicle_no || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Received By</label>
                   <p className="text-gray-900">
                     {(request as any).received_by || '-'}
                   </p>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Received From</label>
                   <p className="text-gray-900">
                     {(request as any).received_from || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Delivered To</label>
                   <p className="text-gray-900">
                     {(request as any).delivered_to || '-'}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Delivered By</label>
                   <p className="text-gray-900">
                     {(request as any).delivered_by || '-'}
                   </p>
                 </div>
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
              <span>Approved By: {request.approved_by || 'Unknown'}</span>
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