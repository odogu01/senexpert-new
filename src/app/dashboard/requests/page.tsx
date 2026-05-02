'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Clock, AlertTriangle, Package, Filter, Ban } from 'lucide-react';
import { getToolRequestsApi, createToolRequestApi, updateToolRequestStatusApi, getToolsApi, getProfileApi } from '@/lib/apiClient';
import { getStoredUser } from '@/lib/authContext';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { ToolRequest, Tool, ToolStatus } from '@/lib/database.types';
import type { UserRole } from '@/lib/database.types';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('senexpert_token');
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [movementFilter, setMovementFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    toolId: '',
    quantity: '1',
    movementType: 'outgoing' as 'incoming' | 'outgoing',
    location: 'Warehouse A',
    notes: '',
    vehicleNo: '',
    deliveredTo: '',
    deliveredBy: '',
    receivedBy: '',
    receivedFrom: '',
  });

  useEffect(() => {
    // Wait a bit for auth context to initialize
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const profileResponse = await getProfileApi();
    if (profileResponse.success && profileResponse.data) {
      setUserRole(profileResponse.data.role);
    }

    await loadData();
    setLoading(false);
  }

  // Permission checks
  const canCreateRequest = userRole === 'super_admin' || userRole === 'admin' || userRole === 'field' || userRole === 'operator';
  const canApprove = userRole === 'super_admin' || userRole === 'admin';

  async function loadData() {
    setLoading(true);
    try {
      // Load requests
      const requestsResponse = await getToolRequestsApi();
      if (requestsResponse.success && requestsResponse.data) {
        setRequests(requestsResponse.data);
      }

      // Load available tools
      const toolsResponse = await getToolsApi();
      if (toolsResponse.success && toolsResponse.data) {
        setTools(toolsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesMovement = movementFilter === 'all' || req.movement_type === movementFilter;
    return matchesStatus && matchesMovement;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requestData: any = {
        tool_id: formData.toolId,
        movement_type: formData.movementType,
        quantity: parseInt(formData.quantity),
        location: formData.location,
        notes: formData.notes || undefined,
      };

      // Add fields based on movement type
      if (formData.movementType === 'outgoing') {
        requestData.vehicle_no = formData.vehicleNo;
        requestData.delivered_to = formData.deliveredTo;
        requestData.delivered_by = formData.deliveredBy;
      } else {
        requestData.vehicle_no = formData.vehicleNo;
        requestData.received_by = formData.receivedBy;
        requestData.received_from = formData.receivedFrom;
      }

      const response = await createToolRequestApi(requestData);

      if (response.success) {
        alert('Request submitted successfully!');
        setShowModal(false);
        // Reset form
        setFormData({
          toolId: '',
          quantity: '1',
          movementType: 'outgoing',
          location: 'Warehouse A',
          notes: '',
          vehicleNo: '',
          deliveredTo: '',
          deliveredBy: '',
          receivedBy: '',
          receivedFrom: '',
        });
        loadData();
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    try {
      const response = await updateToolRequestStatusApi(id, status);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tool Requests</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Manage tool movement requests</p>
        </div>
        {canCreateRequest && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors text-sm lg:text-base"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{approvedCount}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rejectedCount}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Movements</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Movement</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No requests found</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      #{request.id.slice(0, 8)}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        request.movement_type === 'incoming' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {request.movement_type}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <StatusBadge status={request.status} size="sm" />
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {request.tool_name || 'Tool'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {(request as unknown as Record<string, unknown>).location as string || '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {request.quantity}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {request.notes || '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusChange(request.id, 'approved')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'completed')}
                          className="px-3 py-1 text-sm bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
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
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">New Tool Request</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                  <select
                    value={formData.movementType}
                    onChange={(e) => setFormData({ ...formData, movementType: e.target.value as 'incoming' | 'outgoing' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="outgoing">Outgoing</option>
                    <option value="incoming">Incoming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Tool</label>
                  <select
                    value={formData.toolId}
                    onChange={(e) => setFormData({ ...formData, toolId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select a tool...</option>
                    {tools.map(tool => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name} | {tool.size_thread || '-'} | {tool.material || '-'} | {tool.model || '-'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {/* Conditional fields based on movement type */}
                {formData.movementType === 'outgoing' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label>
                      <input
                        type="text"
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter vehicle number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivered To</label>
                      <input
                        type="text"
                        value={formData.deliveredTo}
                        onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter recipient location/company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivered By</label>
                      <input
                        type="text"
                        value={formData.deliveredBy}
                        onChange={(e) => setFormData({ ...formData, deliveredBy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter deliverer's name"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label>
                      <input
                        type="text"
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter vehicle number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                      <input
                        type="text"
                        value={formData.receivedBy}
                        onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter receiver's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Received From</label>
                      <input
                        type="text"
                        value={formData.receivedFrom}
                        onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter sender location/company"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}