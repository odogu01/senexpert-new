'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/authContext';
import { getFinancialRequestsApi, createFinancialRequestApi, updateFinancialRequestStatusApi, getProfileApi } from '@/lib/apiClient';
import type { UserRole } from '@/lib/database.types';
import type { FinancialRequest } from '@/lib/database.types';
import { Plus, DollarSign, Clock, CheckCircle, XCircle, FileText, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const CATEGORIES = [
  'Equipment Purchase',
  'Maintenance & Repair',
  'Training & Development',
  'Travel & Accommodation',
  'Office Supplies',
  'Software & Subscriptions',
  'Other',
];

export default function FinancialRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole; full_name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: CATEGORIES[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);

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
      setCurrentUser({
        id: user.id,
        role: profileResponse.data.role,
        full_name: profileResponse.data.full_name || 'User',
      });
    }

    await loadRequests();
    setLoading(false);
  }

  async function loadRequests() {
    const response = await getFinancialRequestsApi();
    if (response.success && response.data) {
      setRequests(response.data);
    }
  }

  const canRequest = currentUser?.role === 'super_admin';
  const canApprove = currentUser?.role === 'super_admin' || currentUser?.role === 'accountant';

  const filteredRequests = statusFilter
    ? requests.filter(r => r.status === statusFilter)
    : requests;

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.amount) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (!currentUser) return;

    setFormLoading(true);
    setFormError('');

    try {
      const response = await createFinancialRequestApi({
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        requested_by: currentUser.id,
      });

      if (response.success) {
        setShowModal(false);
        setFormData({ title: '', description: '', amount: '', category: CATEGORIES[0] });
        await loadRequests();
      } else {
        setFormError(response.error || 'Failed to create request');
      }
    } catch (error) {
      setFormError('An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    if (!currentUser) return;

    try {
      const response = await updateFinancialRequestStatusApi(
        id,
        approved ? 'approved' : 'rejected',
        currentUser.id
      );

      if (response.success) {
        await loadRequests();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };
    return badges[status] || badges.pending;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-4 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Financial Requests</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Request and manage budget approvals</p>
        </div>
        {canRequest && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'pending').length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => r.status === 'approved').length}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0))}</p>
              <p className="text-sm text-gray-500">Total Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Requested By</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Date</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No financial requests found</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const badge = getStatusBadge(request.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <p className="text-sm text-gray-500 md:hidden">{request.category}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{request.category}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-medium text-gray-900">{formatCurrency(request.amount)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                        {request.requested_by === currentUser?.id ? 'You' : 'User'}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {request.status === 'approved' && (
                            <button
                              onClick={() => window.open(`/dashboard/financial-requests/${request.id}/print`, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded text-green-600"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Request Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">New Financial Request</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    placeholder="Enter request title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    placeholder="Describe the purpose of this request..."
                  />
                </div>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {formError}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                  <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Title</label>
                  <p className="font-medium text-gray-900">{selectedRequest.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Category</label>
                  <p className="font-medium text-gray-900">{selectedRequest.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Amount</label>
                  <p className="font-medium text-gray-900 text-lg">{formatCurrency(selectedRequest.amount)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRequest.status).bg} ${getStatusBadge(selectedRequest.status).text}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm text-gray-500">Notes</label>
                    <p className="text-gray-600">{selectedRequest.notes}</p>
                  </div>
                )}
                
                {/* Approval Actions */}
                {selectedRequest.status === 'pending' && canApprove && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => { handleApprove(selectedRequest.id, false); setSelectedRequest(null); }}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => { handleApprove(selectedRequest.id, true); setSelectedRequest(null); }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'approved' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.open(`/dashboard/financial-requests/${selectedRequest.id}/print`, '_blank')}
                      className="w-full px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Print / Download PDF
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}