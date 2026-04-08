'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import type { FinancialRequest } from '@/lib/database.types';
import { Printer, ArrowLeft, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';

export default function PrintFinancialRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<FinancialRequest | null>(null);
  const [requesterName, setRequesterName] = useState('');
  const [approverName, setApproverName] = useState('');

  useEffect(() => {
    loadRequest();
  }, [params.id]);

  async function loadRequest() {
    const { user } = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (!supabase || !params.id) return;

    // Fetch the request
    const { data: requestData, error } = await supabase
      .from('financial_requests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !requestData) {
      router.push('/dashboard/financial-requests');
      return;
    }

    setRequest(requestData);

    // Get requester name
    if (requestData.requested_by) {
      const { data: requesterData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', requestData.requested_by)
        .single();
      setRequesterName(requesterData?.full_name || 'Unknown');
    }

    // Get approver name
    if (requestData.approved_by) {
      const { data: approverData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', requestData.approved_by)
        .single();
      setApproverName(approverData?.full_name || 'Unknown');
    }

    setLoading(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      {/* Print Button - Hidden when printing */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <button
          onClick={() => router.push('/dashboard/financial-requests')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* Header */}
        <div className="border-b-2 border-[#0B3C6D] p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0B3C6D]">SENEXPERT GLOBAL</h1>
              <p className="text-gray-500">Financial Request Form</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Document Date</p>
              <p className="font-medium">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="p-8">
          {/* Status Badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full ${request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="font-medium capitalize">{request.status}</span>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h2>
            <div className="flex items-center gap-2 text-3xl font-bold text-[#0B3C6D]">
              <DollarSign className="w-8 h-8" />
              {formatCurrency(request.amount)}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">Requested By</span>
              </div>
              <p className="font-medium text-gray-900">{requesterName}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Request Date</span>
              </div>
              <p className="font-medium text-gray-900">{formatDate(request.created_at)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <span className="text-sm">Category</span>
              </div>
              <p className="font-medium text-gray-900">{request.category}</p>
            </div>
            {request.approved_at && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Approved Date</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(request.approved_at)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Approval Section */}
          {request.status === 'approved' && (
            <div className="border-t-2 border-gray-200 pt-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Approval</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved By</p>
                  <p className="font-medium text-gray-900">{approverName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Approved</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-200">
            <div>
              <div className="border-b border-gray-300 h-16"></div>
              <p className="text-sm text-gray-500 mt-2">Requested By</p>
            </div>
            <div>
              <div className="border-b border-gray-300 h-16"></div>
              <p className="text-sm text-gray-500 mt-2">Approved By (HR/Finance)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-400">
          <p>Document ID: {request.id}</p>
          <p>Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { 
            background: white; 
          }
          .print\\:hidden { 
            display: none !important; 
          }
          .print\\:shadow-none { 
            box-shadow: none !important; 
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
}