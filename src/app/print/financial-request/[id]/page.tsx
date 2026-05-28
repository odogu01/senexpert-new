'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFinancialRequestsApi } from '@/lib/apiClient';
import type { FinancialRequest } from '@/lib/database.types';
import { Printer, ArrowLeft } from 'lucide-react';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('senexpert_token');
}

export default function PrintFinancialRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<FinancialRequest | null>(null);

  useEffect(() => {
    loadRequest();
  }, [params.id]);

  async function loadRequest() {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await getFinancialRequestsApi();
      if (response.success && response.data) {
        const foundRequest = response.data.find((r: FinancialRequest) => r.id === params.id);
        if (foundRequest) {
          setRequest(foundRequest);
        } else {
          router.push('/dashboard/financial-requests');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load request:', error);
      router.push('/dashboard/financial-requests');
      return;
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleBack = () => {
    router.push('/dashboard/financial-requests');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen print-bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 flex items-center justify-center h-screen print-bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Request not found</p>
          <button
            onClick={() => router.push('/dashboard/financial-requests')}
            className="px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white print-page">
      <style>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0;
            padding: 0;
          }
          .print-hidden { 
            display: none !important; 
          }
          .print-content {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      
      <div className="mb-8 text-center print-hidden">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mx-auto mb-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0B3C6D]/90 mx-auto"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 print-content">
        <div className="text-center mb-8 pb-4 border-b">
          <img src="/title-logo.png" alt="SenExpert Global" className="w-20 h-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0B3C6D]">Financial Request</h1>
          <p className="text-gray-500">Request ID: {request.id}</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold">{request.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <p className="text-lg font-semibold text-[#0B3C6D]">
                ${request.amount?.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="text-gray-900">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <p>{request.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="capitalize">{request.status}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-gray-700">{request.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</span>
            <span>Requested By: {request.requested_by || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}