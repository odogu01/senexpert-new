'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getStoredProfile } from '@/lib/authContext';
import { getToolRequestsApi, updateToolRequestStatusApi, getFinancialRequestsApi, updateFinancialRequestStatusApi, getProfileApi } from '@/lib/apiClient';
import type { UserRole } from '@/lib/database.types';
import type { ToolRequest, FinancialRequest } from '@/lib/database.types';
import { CheckCircle, XCircle, Clock, DollarSign, Package, Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RequestWithDetails extends ToolRequest {
  tool_name?: string;
  requester_name?: string;
}

interface FinancialWithDetails extends FinancialRequest {
  requester_name?: string;
}

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

export default function ApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<'tools' | 'financial'>('tools');
  const [toolRequests, setToolRequests] = useState<RequestWithDetails[]>([]);
  const [financialRequests, setFinancialRequests] = useState<FinancialWithDetails[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
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

    const profileResponse = await getProfileApi();
    if (profileResponse.success && profileResponse.data) {
      const role = profileResponse.data.role;
      // Only allow hr, admin, super_admin to view approvals
      if (!['hr', 'admin', 'super_admin'].includes(role)) {
        router.push('/dashboard');
        return;
      }
      setUserRole(role);
    }

    await loadData();
    setLoading(false);
  }

  async function loadData() {
    try {
      // Load tool requests
      const toolRes = await getToolRequestsApi();
      if (toolRes.success && toolRes.data) {
        setToolRequests(toolRes.data);
      }

      // Load financial requests
      const financialRes = await getFinancialRequestsApi();
      if (financialRes.success && financialRes.data) {
        setFinancialRequests(financialRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  const handleApproveToolRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const user = getCurrentUserFromStorage();
      await updateToolRequestStatusApi(id, 'approved', user?.id);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectToolRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const user = getCurrentUserFromStorage();
      await updateToolRequestStatusApi(id, 'rejected', user?.id);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveFinancialRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const user = getCurrentUserFromStorage();
      await updateFinancialRequestStatusApi(id, 'approved', user?.id);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFinancialRequest = async (id: string) => {
    setProcessingId(id);
    try {
      const user = getCurrentUserFromStorage();
      await updateFinancialRequestStatusApi(id, 'rejected', user?.id);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const pendingToolRequests = toolRequests.filter(r => r.status === 'pending');
  const pendingFinancialRequests = financialRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'tools' 
              ? 'bg-[#0B3C6D] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Tool Requests
          {pendingToolRequests.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingToolRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'financial' 
              ? 'bg-[#0B3C6D] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Financial Requests
          {pendingFinancialRequests.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingFinancialRequests.length}
            </span>
          )}
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
              {pendingToolRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.tool_name || 'Tool Request'}</h3>
                          <p className="text-sm text-gray-500">
                            Requested by: {request.requester_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-13">
                        <span>Type: {request.movement_type}</span>
                        <span>Quantity: {request.quantity}</span>
                        {request.assigned_to && <span>Assigned to: {request.assigned_to}</span>}
                        {request.notes && <span className="text-gray-500">Note: {request.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectToolRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveToolRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
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
              {pendingFinancialRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{request.title}</h3>
                          <p className="text-sm text-gray-500">
                            Requested by: {request.requester_name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(request.amount)}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        <p className="text-sm text-gray-500 mt-1">Category: {request.category}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectFinancialRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveFinancialRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
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