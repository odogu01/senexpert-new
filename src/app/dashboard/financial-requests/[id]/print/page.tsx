'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/authContext';
import { getFinancialRequestsApi } from '@/lib/apiClient';
import type { FinancialRequest } from '@/lib/database.types';
import { Printer, ArrowLeft, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';

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

    const user = getCurrentUserFromStorage();
    if (!user) {
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

      <div className="bg-white rounded-lg shadow-lg p-8 print:bg-white print:shadow-none">
        <div className="text-center mb-8">
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