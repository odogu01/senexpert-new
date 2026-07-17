'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, AlertTriangle, Package, Printer } from 'lucide-react';
import { useToolRequests, useCreateToolRequest, useTools, useProfile } from '@/hooks/api';
import { getAuthHeaders } from '@/lib/query';
import StatusBadge from '@/components/dashboard/StatusBadge';
import PaginationBar from '@/components/dashboard/PaginationBar';
import PrintModal from '@/components/dashboard/PrintModal';
import type { ToolRequest, Tool } from '@/lib/database.types';

export default function RequestsPage() {
  const { data: requests = [] } = useToolRequests();
  const { data: tools = [] } = useTools();
  const { data: profile } = useProfile();

  const [printRequestId, setPrintRequestId] = useState<string | null>(null);

  const { mutateAsync: createRequest } = useCreateToolRequest();

  const userRole = profile?.role ?? null;
  // Show New Request button immediately if a token exists (optimistic), then
  // respect role once profile loads. Most roles can create requests anyway.
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token');
  const canCreateRequest = !profile
    ? hasToken
    : (userRole === 'super_admin' || userRole === 'admin' || userRole === 'operator');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [printTool, setPrintTool] = useState<Tool | null>(null);
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

    // Receiving history (already-added tools shown as added)
    for (const tool of receivedTools) {
      items.push({
        id: `tool-${tool.id}`,
        type: 'receipt',
        status: 'added',
        tool_name: tool.name,
        location: tool.location,
        quantity: tool.quantity,
        notes: `Received from: ${tool.received_from || 'N/A'}`,
        created_at: tool.created_at,
        tool,
      });
    }

    // Sort: pending first, then by created_at descending
    items.sort((a, b) => {
      const aPending = a.status === 'pending' ? 0 : 1;
      const bPending = b.status === 'pending' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
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
    transactionType: 'sold' as 'sold' | 'rented' | 'job',
    location: '',
    notes: '',
    vehicleNo: '',
    deliveredTo: '',
    deliveredBy: '',
    receivedBy: '',
    receivedFrom: '',
    jobName: '',
  });
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // ── Multi-tool cart (outgoing only) ──
  interface CartEntry {
    key: string;
    toolId: string;
    toolName: string;
    sizeThread: string;
    material: string;
    model: string;
    workOrderNumber: string;
    materialNo: string;
    partNumber: string;
    quantity: string;
    maxQuantity: number | null;
  }
  const [cartItems, setCartItems] = useState<CartEntry[]>([]);
  let cartKeyCounter = useRef(0);

  const addCartItem = () => {
    cartKeyCounter.current++;
    setCartItems(prev => [...prev, {
      key: `cart-${cartKeyCounter.current}`,
      toolId: '',
      toolName: '',
      sizeThread: '',
      material: '',
      model: '',
      workOrderNumber: '',
      materialNo: '',
      partNumber: '',
      quantity: '1',
      maxQuantity: null,
    }]);
  };

  const updateCartItem = (key: string, updates: Partial<CartEntry>) => {
    setCartItems(prev => prev.map(item => item.key === key ? { ...item, ...updates } : item));
  };

  const removeCartItem = (key: string) => {
    setCartItems(prev => prev.filter(item => item.key !== key));
  };

  // Resolve available quantity for a specific tool selection in a cart row
  const getCartToolQty = (item: CartEntry): number => {
    if (!item.toolName) return 0;
    const match = tools.filter(t => t.name === item.toolName)
      .filter(t => !item.sizeThread || t.size_thread === item.sizeThread)
      .filter(t => !item.material || t.material === item.material)
      .filter(t => !item.model || t.model === item.model);
    return match[0]?.quantity ?? 0;
  };

  // Filtered tools for cart rows (exclude rentals for outgoing)
  const outgoingTools = useMemo(() => tools, [tools]);

  const filteredOutgoing = (requests as ToolRequest[])
    .filter(req =>
      req.movement_type === 'outgoing' && (statusFilter === 'all' || req.status === statusFilter)
    )
    .sort((a, b) => {
      const aPending = a.status === 'pending' ? 0 : 1;
      const bPending = b.status === 'pending' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // ── Pagination ──
  const totalIncomingPages = Math.max(1, Math.ceil(filteredIncoming.length / itemsPerPage));
  const totalOutgoingPages = Math.max(1, Math.ceil(filteredOutgoing.length / itemsPerPage));
  const displayIncoming = filteredIncoming.slice((incomingPage - 1) * itemsPerPage, incomingPage * itemsPerPage);
  const displayOutgoing = filteredOutgoing.slice((outgoingPage - 1) * itemsPerPage, outgoingPage * itemsPerPage);

  // Stats: items from tool_requests only (exclude receiving history dump)
  const workflowItems = incomingItems.filter(r => !!r.request);
  const pendingCount = workflowItems.filter(r => r.status === 'pending').length;
  const rejectedCount = workflowItems.filter(r => r.status === 'rejected').length;
  // Approved Tools = count all approved requests across both incoming and outgoing
  const approvedToolsCount = requests.filter(r => r.status === 'approved').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const requestData: Record<string, unknown> = {
        movement_type: formData.movementType,
        location: formData.location,
        notes: formData.notes || undefined,
      };

      if (formData.movementType === 'outgoing') {
        requestData.transaction_type = formData.transactionType;
        requestData.vehicle_no = formData.vehicleNo;

        if (formData.transactionType === 'job') {
          requestData.delivered_by = 'Senexpert';
          requestData.delivered_to = formData.jobName || 'Job';
          requestData.notes = `Job: ${formData.jobName || formData.notes || ''}`.trim();
        } else {
          requestData.delivered_to = formData.deliveredTo;
          requestData.delivered_by = formData.deliveredBy;
        }

        // Multi-tool cart
        if (cartItems.length > 0) {
          // Validate all cart entries have a tool selected and valid quantity
          for (const item of cartItems) {
            if (!item.toolId) {
              setQuantityError(`Please complete the tool selection for "${item.toolName || 'a row'}"`);
              return;
            }
            const qty = parseInt(item.quantity);
            const avail = getCartToolQty(item);
            if (qty > avail) {
              setQuantityError(`"${item.toolName}" max available quantity is ${avail}. You requested ${qty}.`);
              return;
            }
          }

          requestData.items = cartItems.map(item => ({
            tool_id: item.toolId,
            tool_name: item.toolName,
            quantity: parseInt(item.quantity),
            size_thread: item.sizeThread || undefined,
            material: item.material || undefined,
            model: item.model || undefined,
            work_order_number: item.workOrderNumber || undefined,
            material_no: item.materialNo || undefined,
            part_number: item.partNumber || undefined,
          }));
          requestData.tool_id = cartItems[0].toolId;
          requestData.quantity = cartItems.reduce((sum, item) => sum + parseInt(item.quantity), 1);
        } else {
          // Single tool (backward compat)
          const parsedQuantity = parseInt(formData.quantity);
          if (maxQuantity !== null && parsedQuantity > maxQuantity) {
            setQuantityError(`Maximum available quantity is ${maxQuantity}. You requested ${parsedQuantity}.`);
            return;
          }
          requestData.tool_id = formData.toolId;
          requestData.quantity = parsedQuantity;
        }
      } else {
        // Incoming
        requestData.tool_id = formData.toolId;
        requestData.quantity = parseInt(formData.quantity);
        requestData.vehicle_no = formData.vehicleNo;
        requestData.received_by = formData.receivedBy;
        requestData.received_from = formData.receivedFrom;
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
    setCartItems([]);
    setFormData({
      toolId: '',
      toolName: '',
      sizeThread: '',
      material: '',
      model: '',
      quantity: '1',
      movementType: 'outgoing',
      transactionType: 'sold',
      location: '',
      notes: '',
      vehicleNo: '',
      deliveredTo: '',
      deliveredBy: '',
      receivedBy: '',
      receivedFrom: '',
      jobName: '',
    });
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
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {request.items && request.items.length > 1
                        ? <div className="flex flex-col gap-0.5">{request.items.map((item, i) => (
                            <span key={i}>{item.tool_name || 'N/A'}</span>
                          ))}</div>
                        : (request.tool_name || 'N/A')
                      }
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{(request as unknown as Record<string, unknown>).location as string || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                      {request.items && request.items.length > 1
                        ? <div className="flex flex-col gap-0.5">{request.items.map((item, i) => (
                            <span key={i}>{item.quantity}</span>
                          ))}</div>
                        : request.quantity
                      }
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.vehicle_no || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{request.delivered_by || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.notes || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {request.status !== 'pending' && (
                          <button onClick={() => setPrintRequestId(request.id)} className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]">
                            <Printer className="w-4 h-4" />
                          </button>
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
          <div className="px-6 py-3 border-t border-gray-200">
            <PaginationBar
              currentPage={outgoingPage}
              totalPages={totalOutgoingPages}
              onPageChange={setOutgoingPage}
            />
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
                        {(item.request && item.request.status !== 'pending') && (
                          <button onClick={() => setPrintRequestId(item.request!.id)} className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]">
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {item.tool && (
                          <button
                            onClick={() => setPrintTool(item.tool!)}
                            className="p-1 hover:bg-gray-100 rounded text-[#0B3C6D]"
                            title="Print tool receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
          <div className="px-6 py-3 border-t border-gray-200">
            <PaginationBar
              currentPage={incomingPage}
              totalPages={totalIncomingPages}
              onPageChange={setIncomingPage}
            />
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
                    <select value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'sold' | 'rented' | 'job' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                      <option value="job">Job</option>
                    </select>
                  </div>
                )}

                {formData.movementType === 'outgoing' ? (
                  <>
                    {/* Multi-tool cart */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tools ({cartItems.length})</span>
                        <button type="button" onClick={addCartItem} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a]">
                          <Plus className="w-3.5 h-3.5" /> Add Tool
                        </button>
                      </div>
                      {cartItems.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          Click "Add Tool" to select tools for this request
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                          {cartItems.map((item, idx) => (
                            <div key={item.key} className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Tool #{idx + 1}</span>
                                <button type="button" onClick={() => removeCartItem(item.key)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-2">
                                  <select
                                    value={item.toolName}
                                    onChange={(e) => {
                                      const name = e.target.value;
                                      const match = tools.filter(t => t.name === name);
                                      const first = match[0];
                                      updateCartItem(item.key, {
                                        toolName: name,
                                        toolId: first?.id || '',
                                        sizeThread: first?.size_thread || '',
                                        material: first?.material || '',
                                        model: first?.model || '',
                                        workOrderNumber: first?.work_order_number || '',
                                        materialNo: first?.material_no || '',
                                        partNumber: first?.part_number || '',
                                        quantity: '1',
                                        maxQuantity: first?.quantity ?? null,
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select tool...</option>
                                    {Array.from(new Set(tools.map(t => t.name))).map(name => (
                                      <option key={name} value={name}>{name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Size/Thread</label>
                                  <select
                                    value={item.sizeThread}
                                    onChange={(e) => {
                                      const st = e.target.value;
                                      const match = tools.filter(t => t.name === item.toolName && t.size_thread === st);
                                      const first = match[0];
        updateCartItem(item.key, {
          sizeThread: st,
          toolId: first?.id || '',
          material: first?.material || '',
          model: first?.model || '',
          workOrderNumber: first?.work_order_number || '',
          materialNo: first?.material_no || '',
          partNumber: first?.part_number || '',
          maxQuantity: first?.quantity ?? null,
        });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Size/Thread</option>
                                    {Array.from(new Set(
                                      tools.filter(t => t.name === item.toolName)
                                        .map(t => t.size_thread || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Material</label>
                                  <select
                                    value={item.material}
                                    onChange={(e) => {
                                      const mat = e.target.value;
                                      const match = tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === mat
                                      );
                                      const first = match[0];
        updateCartItem(item.key, {
          material: mat,
          toolId: first?.id || '',
          model: first?.model || '',
          workOrderNumber: first?.work_order_number || '',
          materialNo: first?.material_no || '',
          partNumber: first?.part_number || '',
          maxQuantity: first?.quantity ?? null,
        });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Material</option>
                                    {Array.from(new Set(
                                      tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread
                                      )
                                        .map(t => t.material || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Model</label>
                                  <select
                                    value={item.model}
                                    onChange={(e) => {
                                      const mod = e.target.value;
                                      const match = tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === mod
                                      );
                                      const first = match[0];
        updateCartItem(item.key, {
          model: mod,
          toolId: first?.id || '',
          workOrderNumber: first?.work_order_number || '',
          materialNo: first?.material_no || '',
          partNumber: first?.part_number || '',
          maxQuantity: first?.quantity ?? null,
        });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Model</option>
                                    {Array.from(new Set(
                                      tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material
                                      )
                                        .map(t => t.model || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Qty (Avail: {getCartToolQty(item)})</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={getCartToolQty(item) || 999}
                                    value={item.quantity}
                                    onChange={(e) => updateCartItem(item.key, { quantity: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">W/O</label>
                                  <select
                                    value={item.workOrderNumber}
                                    onChange={(e) => {
                                      const won = e.target.value;
                                      const match = tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model &&
                                        t.work_order_number === won
                                      );
                                      const first = match[0];
                                      updateCartItem(item.key, {
                                        workOrderNumber: won,
                                        materialNo: first?.material_no || '',
                                        partNumber: first?.part_number || '',
                                        toolId: first?.id || '',
                                        maxQuantity: first?.quantity ?? null,
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">W/O</option>
                                    {Array.from(new Set(
                                      tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model
                                      )
                                        .map(t => t.work_order_number || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Material No</label>
                                  <select
                                    value={item.materialNo}
                                    onChange={(e) => {
                                      const mn = e.target.value;
                                      const match = tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model &&
                                        t.work_order_number === item.workOrderNumber &&
                                        t.material_no === mn
                                      );
                                      const first = match[0];
                                      updateCartItem(item.key, {
                                        materialNo: mn,
                                        partNumber: first?.part_number || '',
                                        toolId: first?.id || '',
                                        maxQuantity: first?.quantity ?? null,
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Material No</option>
                                    {Array.from(new Set(
                                      tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model &&
                                        t.work_order_number === item.workOrderNumber
                                      )
                                        .map(t => t.material_no || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Part Number</label>
                                  <select
                                    value={item.partNumber}
                                    onChange={(e) => {
                                      const pn = e.target.value;
                                      const match = tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model &&
                                        t.work_order_number === item.workOrderNumber &&
                                        t.material_no === item.materialNo &&
                                        t.part_number === pn
                                      );
                                      const first = match[0];
                                      updateCartItem(item.key, {
                                        partNumber: pn,
                                        toolId: first?.id || '',
                                        maxQuantity: first?.quantity ?? null,
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                  >
                                    <option value="">Part Number</option>
                                    {Array.from(new Set(
                                      tools.filter(t =>
                                        t.name === item.toolName &&
                                        t.size_thread === item.sizeThread &&
                                        t.material === item.material &&
                                        t.model === item.model &&
                                        t.work_order_number === item.workOrderNumber &&
                                        t.material_no === item.materialNo
                                      )
                                        .map(t => t.part_number || '')
                                        .filter(v => v !== '')
                                    )).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label><input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter vehicle number" /></div>
                    {formData.transactionType === 'job' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
                        <input type="text" value={formData.jobName} onChange={(e) => setFormData({ ...formData, jobName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Well completion Job #123" />
                      </div>
                    ) : (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivered To</label><input type="text" value={formData.deliveredTo} onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter recipient location/company" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivered By</label><input type="text" value={formData.deliveredBy} onChange={(e) => setFormData({ ...formData, deliveredBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter deliverer's name" /></div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
                      <select value={formData.toolName} onChange={(e) => {
                        const toolName = e.target.value;
                        const filteredTools = tools.filter(t => t.status === 'rentals');
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
                          quantity: '1',
                        });
                      }} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
                        <option value="">Select tool name...</option>
                        {Array.from(new Set(
                          tools.filter(t => t.status === 'rentals').map(t => t.name)
                        )).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size/Thread</label>
                      <select value={formData.sizeThread} onChange={(e) => {
                        const sizeThread = e.target.value;
                        const match = tools.filter(t =>
                          t.status === 'rentals' &&
                          t.name === formData.toolName &&
                          t.size_thread === sizeThread
                        );
                        const first = match[0];
                        setMaxQuantity(first?.quantity || 0);
                        setFormData({ ...formData, sizeThread, toolId: first?.id || '', material: first?.material || '', model: first?.model || '' });
                      }} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select size/thread...</option>
                        {Array.from(new Set(
                          tools.filter(t => t.status === 'rentals' && t.name === formData.toolName)
                            .map(t => t.size_thread || '')
                            .filter(v => v !== '')
                        )).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                      <select value={formData.material} onChange={(e) => {
                        const material = e.target.value;
                        const match = tools.filter(t =>
                          t.status === 'rentals' &&
                          t.name === formData.toolName &&
                          t.size_thread === formData.sizeThread &&
                          t.material === material
                        );
                        const first = match[0];
                        setMaxQuantity(first?.quantity || 0);
                        setFormData({ ...formData, material, toolId: first?.id || '', model: first?.model || '' });
                      }} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select material...</option>
                        {Array.from(new Set(
                          tools.filter(t =>
                            t.status === 'rentals' &&
                            t.name === formData.toolName &&
                            t.size_thread === formData.sizeThread
                          )
                            .map(t => t.material || '')
                            .filter(v => v !== '')
                        )).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select value={formData.model} onChange={(e) => {
                        const model = e.target.value;
                        const match = tools.filter(t =>
                          t.status === 'rentals' &&
                          t.name === formData.toolName &&
                          t.size_thread === formData.sizeThread &&
                          t.material === formData.material &&
                          t.model === model
                        );
                        const first = match[0];
                        setMaxQuantity(first?.quantity || 0);
                        setFormData({ ...formData, model, toolId: first?.id || '' });
                      }} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">Select model...</option>
                        {Array.from(new Set(
                          tools.filter(t =>
                            t.status === 'rentals' &&
                            t.name === formData.toolName &&
                            t.size_thread === formData.sizeThread &&
                            t.material === formData.material
                          )
                            .map(t => t.model || '')
                            .filter(v => v !== '')
                        )).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
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
                            Rented: <strong>{maxQuantity}</strong>
                          </span>
                        )}
                      </div>
                      {quantityError && (
                        <p className="mt-1 text-sm text-red-600">{quantityError}</p>
                      )}
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label><input type="text" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter vehicle number" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Received By</label><input type="text" value={formData.receivedBy} onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter receiver's name" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Received From</label><input type="text" value={formData.receivedFrom} onChange={(e) => setFormData({ ...formData, receivedFrom: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter sender location/company" /></div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Warehouse A, Site address" required />
                </div>
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

      {/* Print Preview Modal */}
      <AnimatePresence>
        {printTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setPrintTool(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div id="print-content">
                <div className="p-6 border-b border-gray-200 no-print">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Print Preview</h2>
                    <button onClick={() => setPrintTool(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6" id="print-area">
                  <div className="text-center border-b border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">SenExpert Global Energies</h1>
                    <p className="text-sm text-gray-500">Tool Receiving Receipt</p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Tool Specifications</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">W/O</span>
                        <span className="text-sm text-gray-900">{printTool.work_order_number}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Size/Thread</span>
                        <span className="text-sm text-gray-900">{printTool.size_thread || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Material</span>
                        <span className="text-sm text-gray-900">{printTool.material || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Model</span>
                        <span className="text-sm text-gray-900">{printTool.model || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Material No</span>
                        <span className="text-sm text-gray-900">{printTool.material_no || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Part No</span>
                        <span className="text-sm text-gray-900">{printTool.part_number || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Location</span>
                        <span className="text-sm text-gray-900">{printTool.location || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Tool Name</span>
                        <span className="text-sm text-gray-900">{printTool.name}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Quantity</span>
                        <span className="text-sm text-gray-900">{printTool.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Receiving Information</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Received From</span>
                        <span className="text-sm text-gray-900">{printTool.received_from || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Received By</span>
                        <span className="text-sm text-gray-900">{printTool.received_by || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Vehicle No</span>
                        <span className="text-sm text-gray-900">{printTool.vehicle_number || '-'}</span>
                      </div>
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <span className="text-xs font-semibold text-gray-500 w-32">Date</span>
                        <span className="text-sm text-gray-900">{printTool.created_at ? new Date(printTool.created_at).toLocaleDateString('en-GB') : '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                    <p>Generated by SenExpert Global Energies - SGE System</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 no-print">
                <button onClick={() => setPrintTool(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={() => window.print()} className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PrintModal requestId={printRequestId} onClose={() => setPrintRequestId(null)} />

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content {
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            background: white; z-index: 99999; overflow: auto;
          }
          #print-area { padding: 40px !important; }
          .no-print { display: none !important; }
          @page { margin: 15mm; size: A4 portrait; }
        }
      `}</style>
    </div>
  );
}
