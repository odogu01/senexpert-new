'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, AlertTriangle, Package, Printer, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToolRequests, useCreateToolRequest, useUpdateToolRequestStatus, useTools, useProfile } from '@/hooks/api';
import { getAuthHeaders } from '@/lib/query';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { ToolRequest, Tool } from '@/lib/database.types';

export default function RequestsPage() {
  const { data: requests = [] } = useToolRequests();
  const { data: tools = [] } = useTools();
  const { data: profile } = useProfile();

  const { mutateAsync: createRequest } = useCreateToolRequest();
  const { mutateAsync: updateStatus } = useUpdateToolRequestStatus();

  const userRole = profile?.role ?? null;
  const canCreateRequest = userRole === 'super_admin' || userRole === 'admin' || userRole === 'operator';
  const canApprove = userRole === 'super_admin' || userRole === 'admin';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;
  const [incomingPage, setIncomingPage] = useState(1);
  const [outgoingPage, setOutgoingPage] = useState(1);

  // ── Receiving history: recently added tools ──
  const { data: receivedTools = [] } = useQuery({
    queryKey: ['tools', 'receiving-history', 'recent-50'],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', sort: '-created_at' });
      const res = await fetch(`/api/tools?${params}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch receiving history');
      return (json.data ?? []) as Tool[];
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    staleTime: 5 * 60 * 1000,
  });

  // ── Merge incoming requests + receiving history ──
  type IncomingItem = {
    id: string;
    type: 'request' | 'receipt';
    status: string;
    tool_name?: string;
    location?: string;
    quantity: number;
    notes?: string;
    created_at: Date;
    request?: ToolRequest;
    tool?: Tool;
  };

  const incomingItems: IncomingItem[] = useMemo(() => {
    const items: IncomingItem[] = [];

    // Incoming tool requests (including receipt requests with new_tool_data)
    for (const req of requests.filter(r => r.movement_type === 'incoming')) {
      items.push({
        id: req.id,
        type: req.new_tool_data ? 'receipt' : 'request',
        status: req.status,
        tool_name: req.new_tool_data
          ? (req.new_tool_data as Record<string, unknown>).name as string || 'New Tool'
          : req.tool_name || 'N/A',
        location: req.location || (req.new_tool_data
          ? (req.new_tool_data as Record<string, unknown>).location as string || ''
          : ''),
        quantity: req.quantity || 1,
        notes: req.new_tool_data ? 'New tool receipt' : req.notes,
        created_at: req.created_at,
        request: req,
      });
    }

    // Receiving history (already-added tools shown as approved)
    for (const tool of receivedTools) {
      items.push({
        id: `tool-${tool.id}`,
        type: 'receipt',
        status: 'approved',
        tool_name: tool.name,
        location: tool.location,
        quantity: tool.quantity,
        notes: `Received from: ${tool.received_from || 'N/A'}`,
        created_at: tool.created_at,
        tool,
      });
    }

    // Sort by created_at descending (most recent first)
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [requests, receivedTools]);

  const filteredIncoming = incomingItems.filter(item =>
    statusFilter === 'all' || item.status === statusFilter
  );

  const [formData, setFormData] = useState({
    toolId: '',
    toolName: '',
    sizeThread: '',
    material: '',
    model: '',
    quantity: '1',
    movementType: 'outgoing' as 'incoming' | 'outgoing',
    transactionType: 'sold' as 'sold' | 'rented',
    location: 'Warehouse A',
    notes: '',
    vehicleNo: '',
    deliveredTo: '',
    deliveredBy: '',
    receivedBy: '',
    receivedFrom: '',
  });
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const filteredOutgoing = (requests as ToolRequest[]).filter(req =>
    req.movement_type === 'outgoing' && (statusFilter === 'all' || req.status === statusFilter)
  );

  // ── Pagination ──
  const totalIncomingPages = Math.max(1, Math.ceil(filteredIncoming.length / itemsPerPage));
  const totalOutgoingPages = Math.max(1, Math.ceil(filteredOutgoing.length / itemsPerPage));
  const displayIncoming = filteredIncoming.slice((incomingPage - 1) * itemsPerPage, incomingPage * itemsPerPage);
  const displayOutgoing = filteredOutgoing.slice((outgoingPage - 1) * itemsPerPage, outgoingPage * itemsPerPage);

  const pendingCount = incomingItems.filter(r => r.status === 'pending').length;
  const rejectedCount = incomingItems.filter(r => r.status === 'rejected').length;
  const approvedToolsCount = incomingItems
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.quantity || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate outgoing quantity doesn't exceed available stock
    const parsedQuantity = parseInt(formData.quantity);
    if (formData.movementType === 'outgoing' && maxQuantity !== null && parsedQuantity > maxQuantity) {
      setQuantityError(`Maximum available quantity is ${maxQuantity}. You requested ${parsedQuantity}.`);
      return;
    }

    try {
      const requestData: Record<string, unknown> = {
        tool_id: formData.toolId,
        movement_type: formData.movementType,
        quantity: parseInt(formData.quantity),
        location: formData.location,
        notes: formData.notes || undefined,
      };
      if (formData.movementType === 'outgoing') {
        requestData.vehicle_no = formData.vehicleNo;
        requestData.delivered_to = formData.deliveredTo;
        requestData.delivered_by = formData.deliveredBy;
        requestData.transaction_type = formData.transactionType;
      } else {
        requestData.vehicle_no = formData.vehicleNo;
        requestData.received_by = formData.receivedBy;
        requestData.received_from = formData.receivedFrom;
        // Incoming requests for returning rented tools
        requestData.transaction_type = 'rented';
      }
      await createRequest(requestData);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to submit request:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setMaxQuantity(null);
    setQuantityError(null);
    setFormData({
      toolId: '',
      toolName: '',
      sizeThread: '',
      material: '',
      model: '',
      quantity: '1',
      movementType: 'outgoing',
      transactionType: 'sold',
      location: 'Warehouse A',
      notes: '',
      vehicleNo: '',
      deliveredTo: '',
      deliveredBy: '',
      receivedBy: '',
      receivedFrom: '',
    });
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    try {
      await updateStatus({ id, status });
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

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
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{rejectedCount}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{approvedToolsCount}</p>
              <p className="text-xs text-gray-500">Approved Tools</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setIncomingPage(1); setOutgoingPage(1); }} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Outgoing Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Outgoing Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Delivered By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOutgoing.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No outgoing requests found</p>
                  </td>
                </tr>
              ) : (
                displayOutgoing.map((request: ToolRequest) => (
                  <motion.tr key={request.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">#{request.id.slice(0, 8)}</td>
                    <td className="px-4 lg:px-6 py-4"><StatusBadge status={request.status} size="sm" /></td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.tool_name || 'N/A'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{(request as unknown as Record<string, unknown>).location as string || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.quantity}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.vehicle_no || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.delivered_by || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.notes || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => window.open(`/print/tool-request/${request.id}`, '_blank')} className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]">
                          <Printer className="w-4 h-4" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(request.id, 'approved')} className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Approve</button>
                            <button onClick={() => handleStatusChange(request.id, 'rejected')} className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Outgoing Pagination */}
        {totalOutgoingPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">{filteredOutgoing.length} total</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOutgoingPage(p => Math.max(1, p - 1))}
                disabled={outgoingPage === 1}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalOutgoingPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setOutgoingPage(page)}
                  className={`w-7 h-7 text-xs rounded ${
                    outgoingPage === page ? 'bg-[#0B3C6D] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setOutgoingPage(p => Math.min(totalOutgoingPages, p + 1))}
                disabled={outgoingPage === totalOutgoingPages}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Requests & Receiving History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Incoming & Receiving History</h2>
          <p className="text-sm text-gray-500">Incoming requests, receipt requests, and received tools</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
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
              {filteredIncoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No incoming records found</p>
                  </td>
                </tr>
              ) : (
                displayIncoming.map((item: IncomingItem) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        item.type === 'receipt'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type === 'receipt' ? 'Receipt' : 'Return'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4"><StatusBadge status={item.status as any} size="sm" /></td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{item.tool_name || 'N/A'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{item.location || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(item.request) && (
                          <button onClick={() => window.open(`/print/tool-request/${item.request!.id}`, '_blank')} className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]">
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {item.request && item.request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.request!.id, 'approved')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.request!.id, 'rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {item.tool && !item.request && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> In Inventory
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Incoming Pagination */}
        {totalIncomingPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">{filteredIncoming.length} total</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIncomingPage(p => Math.max(1, p - 1))}
                disabled={incomingPage === 1}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalIncomingPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setIncomingPage(page)}
                  className={`w-7 h-7 text-xs rounded ${
                    incomingPage === page ? 'bg-[#0B3C6D] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setIncomingPage(p => Math.min(totalIncomingPages, p + 1))}
                disabled={incomingPage === totalIncomingPages}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      <AnimatePresence>
        {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">New Tool Request</h2>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>
              <form id="request-form" onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-grow">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                  <select value={formData.movementType} onChange={(e) => {
                    const newMovementType = e.target.value as 'incoming' | 'outgoing';
                    setMaxQuantity(null);
                    setQuantityError(null);
                    setFormData({ 
                      ...formData, 
                      movementType: newMovementType,
                      toolId: '',
                      toolName: '',
                      sizeThread: '',
                      material: '',
                      model: '',
                      quantity: '1',
                      transactionType: newMovementType === 'outgoing' ? 'sold' : 'sold' // Default to sold for both, but rented tools won't appear for incoming
                    });
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="outgoing">Outgoing</option>
                    <option value="incoming">Incoming</option>
                  </select>
                </div>
                {formData.movementType === 'outgoing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <select value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'sold' | 'rented' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
                  <select value={formData.toolName} onChange={(e) => {
                    const toolName = e.target.value;
                    const filteredTools = formData.movementType === 'incoming' 
                      ? tools.filter(t => t.status === 'rentals')
                      : tools;
                    const matchingTools = filteredTools.filter(t => t.name === toolName);
                    const firstTool = matchingTools[0];
                    const toolQuantity = firstTool?.quantity || 0;
                    setMaxQuantity(toolQuantity);
                    setFormData({ 
                      ...formData, 
                      toolName,
                      toolId: firstTool?.id || '',
                      sizeThread: firstTool?.size_thread || '',
                      material: firstTool?.material || '',
                      model: firstTool?.model || '',
                      quantity: formData.movementType === 'outgoing' && toolQuantity > 0
                        ? Math.min(parseInt(formData.quantity), toolQuantity).toString()
                        : formData.quantity
                    });
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select tool name...</option>
                    {Array.from(new Set(
                      (formData.movementType === 'incoming' 
                        ? tools.filter(t => t.status === 'rentals')
                        : tools
                      ).map(t => t.name)
                    )).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size/Thread</label>
                  <select value={formData.sizeThread} onChange={(e) => {
                    const sizeThread = e.target.value;
                    const filteredTools = formData.movementType === 'incoming' 
                      ? tools.filter(t => t.status === 'rentals')
                      : tools;
                    const matchingTools = filteredTools.filter(t => t.name === formData.toolName && t.size_thread === sizeThread);
                    const firstTool = matchingTools[0];
                    const toolQuantity = firstTool?.quantity || 0;
                    setMaxQuantity(toolQuantity);
                    setFormData({ 
                      ...formData, 
                      sizeThread,
                      toolId: firstTool?.id || '',
                      material: firstTool?.material || '',
                      model: firstTool?.model || '',
                      quantity: formData.movementType === 'outgoing' && toolQuantity > 0
                        ? Math.min(parseInt(formData.quantity), toolQuantity).toString()
                        : formData.quantity
                    });
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select size/thread...</option>
                    {Array.from(new Set(
                      (formData.movementType === 'incoming' 
                        ? tools.filter(t => t.status === 'rentals')
                        : tools
                      )
                      .filter(t => t.name === formData.toolName)
                      .map(t => t.size_thread || '')
                      .filter(v => v !== '')
                    )).map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select value={formData.material} onChange={(e) => {
                    const material = e.target.value;
                    const filteredTools = formData.movementType === 'incoming' 
                      ? tools.filter(t => t.status === 'rentals')
                      : tools;
                    const matchingTools = filteredTools.filter(t => 
                      t.name === formData.toolName && 
                      t.size_thread === formData.sizeThread &&
                      t.material === material
                    );
                    const firstTool = matchingTools[0];
                    const toolQuantity = firstTool?.quantity || 0;
                    setMaxQuantity(toolQuantity);
                    setFormData({ 
                      ...formData, 
                      material,
                      toolId: firstTool?.id || '',
                      model: firstTool?.model || '',
                      quantity: formData.movementType === 'outgoing' && toolQuantity > 0
                        ? Math.min(parseInt(formData.quantity), toolQuantity).toString()
                        : formData.quantity
                    });
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select material...</option>
                    {Array.from(new Set(
                      (formData.movementType === 'incoming' 
                        ? tools.filter(t => t.status === 'rentals')
                        : tools
                      )
                      .filter(t => t.name === formData.toolName && t.size_thread === formData.sizeThread)
                      .map(t => t.material || '')
                      .filter(v => v !== '')
                    )).map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <select value={formData.model} onChange={(e) => {
                    const model = e.target.value;
                    const filteredTools = formData.movementType === 'incoming' 
                      ? tools.filter(t => t.status === 'rentals')
                      : tools;
                    const matchingTools = filteredTools.filter(t => 
                      t.name === formData.toolName && 
                      t.size_thread === formData.sizeThread &&
                      t.material === formData.material &&
                      t.model === model
                    );
                    const firstTool = matchingTools[0];
                    const toolQuantity = firstTool?.quantity || 0;
                    setMaxQuantity(toolQuantity);
                    setFormData({ 
                      ...formData, 
                      model,
                      toolId: firstTool?.id || '',
                      quantity: formData.movementType === 'outgoing' && toolQuantity > 0
                        ? Math.min(parseInt(formData.quantity) || 1, toolQuantity).toString()
                        : formData.quantity
                    });
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select model...</option>
                    {Array.from(new Set(
                      (formData.movementType === 'incoming' 
                        ? tools.filter(t => t.status === 'rentals')
                        : tools
                      )
                      .filter(t => 
                        t.name === formData.toolName && 
                        t.size_thread === formData.sizeThread &&
                        t.material === formData.material
                      )
                      .map(t => t.model || '')
                      .filter(v => v !== '')
                    )).map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Warehouse B">Warehouse B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity !== null ? maxQuantity : undefined}
                      value={formData.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, quantity: val });
                        if (maxQuantity !== null && parseInt(val) > maxQuantity) {
                          setQuantityError(`Maximum quantity is ${maxQuantity}`);
                        } else {
                          setQuantityError(null);
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg ${quantityError ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {maxQuantity !== null && (
                      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                        {formData.movementType === 'incoming' ? 'Rented:' : 'Available:'} <strong>{maxQuantity}</strong>
                      </span>
                    )}
                  </div>
                  {quantityError && (
                    <p className="mt-1 text-sm text-red-600">{quantityError}</p>
                  )}
                </div>
                {formData.movementType === 'outgoing' ? (
                  <>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label><input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter vehicle number" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivered To</label><input type="text" value={formData.deliveredTo} onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter recipient location/company" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivered By</label><input type="text" value={formData.deliveredBy} onChange={(e) => setFormData({ ...formData, deliveredBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter deliverer's name" /></div>
                  </>
                ) : (
                  <>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label><input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter vehicle number" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Received By</label><input type="text" value={formData.receivedBy} onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter receiver's name" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Received From</label><input type="text" value={formData.receivedFrom} onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter sender location/company" /></div>
                  </>
                )}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3} /></div>
              </form>
              <div className="p-5 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-3">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" form="request-form" className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]">Submit Request</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
