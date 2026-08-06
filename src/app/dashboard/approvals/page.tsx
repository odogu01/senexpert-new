'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToolRequests, useUpdateToolRequestStatus, useFinancialRequests, useUpdateFinancialRequestStatus, useProfile } from '@/hooks/api';
import type { ToolRequest, FinancialRequest } from '@/lib/database.types';
import { CheckCircle, XCircle, Clock, DollarSign, Package, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApprovalsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: toolRequests = [] } = useToolRequests({ status: 'pending' });
  const { data: financialRequests = [] } = useFinancialRequests({ status: 'pending' });
  const { mutateAsync: updateToolStatus } = useUpdateToolRequestStatus();
  const { mutateAsync: updateFinancialStatus } = useUpdateFinancialRequestStatus();

  const userRole = profile?.role ?? null;

  // Redirect if not allowed
  if (userRole && !['admin', 'super_admin', 'dev'].includes(userRole)) {
    router.push('/dashboard');
    return null;
  }

  const [activeTab, setActiveTab] = useState<'tools' | 'financial'>('tools');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingToolRequests = (toolRequests as ToolRequest[]).filter(r => r.status === 'pending');
  const pendingFinancialRequests = (financialRequests as FinancialRequest[]).filter(r => r.status === 'pending');

  const handleApproveToolRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await updateToolStatus({ id, status: 'approved', approved_by: profile?.id });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectToolRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await updateToolStatus({ id, status: 'rejected', approved_by: profile?.id });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveFinancialRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await updateFinancialStatus({ id, status: 'approved', approved_by: profile?.id });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFinancialRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await updateFinancialStatus({ id, status: 'rejected', approved_by: profile?.id });
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and approve pending requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-[#0B3C6D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <Package className="w-4 h-4" />
          Tool Requests
          {pendingToolRequests.length > 0 && <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingToolRequests.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'financial' ? 'bg-[#0B3C6D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <DollarSign className="w-4 h-4" />
          Financial Requests
          {pendingFinancialRequests.length > 0 && <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingFinancialRequests.length}</span>}
        </button>
      </div>

      {/* Tool Requests */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {pendingToolRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>No pending tool requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingToolRequests.map((request: ToolRequest) => (
                <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-blue-600" /></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.tool_name || 'Tool Request'}</h3>
                          <p className="text-sm text-gray-500">Requested by: {(request as unknown as Record<string, string>).requester_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-13">
                        <span>Type: {request.movement_type}</span>
                        <span>Quantity: {request.quantity}</span>
                        {request.notes && <span className="text-gray-500">Note: {request.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectToolRequest(request.id)} disabled={processingId === request.id} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                      </button>
                      <button onClick={() => handleApproveToolRequest(request.id)} disabled={processingId === request.id} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Financial Requests */}
      {activeTab === 'financial' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {pendingFinancialRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>No pending financial requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingFinancialRequests.map((request: FinancialRequest) => (
                <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-yellow-600" /></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.title}</h3>
                          <p className="text-sm text-gray-500">Requested by: {(request as unknown as Record<string, string>).requester_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(request.amount)}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        <p className="text-sm text-gray-500 mt-1">Category: {request.category}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectFinancialRequest(request.id)} disabled={processingId === request.id} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                      </button>
                      <button onClick={() => handleApproveFinancialRequest(request.id)} disabled={processingId === request.id} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
