'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToolRequests, useUpdateToolRequestStatus, useEditToolRequest, useFinancialRequests, useUpdateFinancialRequestStatus, useProfile, useTools } from '@/hooks/api';
import type { ToolRequest, FinancialRequest } from '@/lib/database.types';
import { CheckCircle, XCircle, Clock, DollarSign, Package, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApprovalsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: toolRequests = [] } = useToolRequests({ status: 'pending' });
  const { data: financialRequests = [] } = useFinancialRequests({ status: 'pending' });
  const { mutateAsync: updateToolStatus } = useUpdateToolRequestStatus();
  const { mutateAsync: editToolRequest } = useEditToolRequest();
  const { data: tools = [] } = useTools();
  const { mutateAsync: updateFinancialStatus } = useUpdateFinancialRequestStatus();

  const userRole = profile?.role ?? null;

  // Redirect if not allowed
  if (userRole && !['admin', 'super_admin', 'accountant', 'dev'].includes(userRole)) {
    router.push('/dashboard');
    return null;
  }

  const [activeTab, setActiveTab] = useState<'tools' | 'financial'>('tools');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ToolRequest | null>(null);
  const [reviewItems, setReviewItems] = useState<Array<{ tool_id: string; tool_name?: string; quantity: number }>>([]);
  const [reviewFields, setReviewFields] = useState({ notes: '', location: '', vehicle_no: '', delivered_to: '', delivered_by: '', received_by: '', received_from: '' });
  const [reviewError, setReviewError] = useState('');

  const pendingToolRequests = (toolRequests as ToolRequest[]).filter(r => r.status === 'pending');
  const pendingFinancialRequests = (financialRequests as FinancialRequest[]).filter(r => r.status === 'pending');
  const canApproveTools = !!userRole && ['admin', 'super_admin', 'dev'].includes(userRole);
  const canApproveFinancial = !!userRole && ['accountant', 'super_admin', 'dev'].includes(userRole);

  const handleApproveToolRequest = async (id: string) => {
    setProcessingId(id);
    try {
      await updateToolStatus({ id, status: 'approved', approved_by: profile?.id });
    } finally {
      setProcessingId(null);
    }
  };

  const openReview = (request: ToolRequest) => {
    const items = request.items?.length
      ? request.items.map(item => ({ tool_id: item.tool_id, tool_name: item.tool_name, quantity: item.quantity }))
      : [{ tool_id: request.tool_id || '', tool_name: request.tool_name || '', quantity: request.quantity || 1 }];
    setReviewRequest(request);
    setReviewItems(items);
    setReviewFields({ notes: request.notes || '', location: request.location || '', vehicle_no: request.vehicle_no || '', delivered_to: request.delivered_to || '', delivered_by: request.delivered_by || '', received_by: request.received_by || '', received_from: request.received_from || '' });
    setReviewError('');
  };

  const saveAndApprove = async () => {
    if (!reviewRequest) return;
    setReviewError('');
    if (reviewItems.some(item => !item.tool_id || item.quantity < 1)) {
      setReviewError('Select a tool and quantity for every item.');
      return;
    }
    setProcessingId(reviewRequest.id);
    try {
      await editToolRequest({ id: reviewRequest.id, items: reviewItems, ...reviewFields });
      await updateToolStatus({ id: reviewRequest.id, status: 'approved', approved_by: profile?.id });
      setReviewRequest(null);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to approve this request.');
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
        {canApproveTools && <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-[#0B3C6D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <Package className="w-4 h-4" />
          Tool Requests
          {pendingToolRequests.length > 0 && <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingToolRequests.length}</span>}
        </button>}
        {canApproveFinancial && <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'financial' ? 'bg-[#0B3C6D] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <DollarSign className="w-4 h-4" />
          Financial Requests
          {pendingFinancialRequests.length > 0 && <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingFinancialRequests.length}</span>}
        </button>}
      </div>

      {/* Tool Requests */}
      {activeTab === 'tools' && canApproveTools && (
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
                      <button onClick={() => request.movement_type === 'outgoing' ? openReview(request) : handleApproveToolRequest(request.id)} disabled={processingId === request.id} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {processingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} {request.movement_type === 'outgoing' ? 'Review & Approve' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tool request review and correction before approval */}
      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !processingId && setReviewRequest(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-semibold text-gray-900">Review tool request</h2><p className="text-sm text-gray-500">Confirm or correct the tools and request details before inventory is updated.</p></div>
              <button onClick={() => setReviewRequest(null)} disabled={!!processingId} className="text-gray-500 hover:text-gray-800"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><strong>Requested by:</strong> {reviewRequest.requester_name || 'Unknown'} &nbsp; <strong>Movement:</strong> {reviewRequest.movement_type}</div>
            <div className="space-y-3">
              {reviewItems.map((item, index) => {
                const selectedTool = tools.find(tool => tool.id === item.tool_id);
                return <div key={index} className="rounded-lg border border-gray-200 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_36px]">
                    <select value={item.tool_id} onChange={event => { const tool = tools.find(candidate => candidate.id === event.target.value); setReviewItems(current => current.map((entry, i) => i === index ? { ...entry, tool_id: event.target.value, tool_name: tool?.name || '' } : entry)); }} className="rounded-lg border border-gray-300 px-3 py-2">
                      <option value="">Select an inventory tool</option>
                      {tools.map(tool => <option key={tool.id} value={tool.id}>{tool.name} — available: {tool.quantity}</option>)}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={event => setReviewItems(current => current.map((entry, i) => i === index ? { ...entry, quantity: Number(event.target.value) } : entry))} className="rounded-lg border border-gray-300 px-3 py-2" aria-label="Quantity" />
                    <button onClick={() => setReviewItems(current => current.filter((_, i) => i !== index))} disabled={reviewItems.length === 1} className="rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30" aria-label="Remove tool"><Trash2 className="mx-auto h-4 w-4" /></button>
                  </div>
                  {selectedTool && <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600 sm:grid-cols-4">
                    <div><dt className="font-medium text-gray-500">Available</dt><dd className="font-semibold text-gray-900">{selectedTool.quantity}</dd></div>
                    <div><dt className="font-medium text-gray-500">Location</dt><dd className="font-semibold text-gray-900">{selectedTool.location || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Size / Thread</dt><dd className="font-semibold text-gray-900">{selectedTool.size_thread || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Material</dt><dd className="font-semibold text-gray-900">{selectedTool.material || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Model</dt><dd className="font-semibold text-gray-900">{selectedTool.model || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Work order</dt><dd className="font-semibold text-gray-900">{selectedTool.work_order_number || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Material no.</dt><dd className="font-semibold text-gray-900">{selectedTool.material_no || '—'}</dd></div>
                    <div><dt className="font-medium text-gray-500">Part no.</dt><dd className="font-semibold text-gray-900">{selectedTool.part_number || '—'}</dd></div>
                  </dl>}
                </div>;
              })}
              <button onClick={() => setReviewItems(current => [...current, { tool_id: '', tool_name: '', quantity: 1 }])} className="flex items-center gap-1 text-sm font-medium text-[#0B3C6D]"><Plus className="h-4 w-4" /> Add another tool</button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={reviewFields.location} onChange={event => setReviewFields(current => ({ ...current, location: event.target.value }))} placeholder="Location" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={reviewFields.vehicle_no} onChange={event => setReviewFields(current => ({ ...current, vehicle_no: event.target.value }))} placeholder="Vehicle number" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={reviewFields.delivered_to} onChange={event => setReviewFields(current => ({ ...current, delivered_to: event.target.value }))} placeholder="Delivered to" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={reviewFields.delivered_by} onChange={event => setReviewFields(current => ({ ...current, delivered_by: event.target.value }))} placeholder="Delivered by" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={reviewFields.received_by} onChange={event => setReviewFields(current => ({ ...current, received_by: event.target.value }))} placeholder="Received by" className="rounded-lg border border-gray-300 px-3 py-2" />
              <input value={reviewFields.received_from} onChange={event => setReviewFields(current => ({ ...current, received_from: event.target.value }))} placeholder="Received from" className="rounded-lg border border-gray-300 px-3 py-2" />
              <textarea value={reviewFields.notes} onChange={event => setReviewFields(current => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="min-h-20 rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2" />
            </div>
            {reviewError && <p className="mt-3 text-sm text-red-600">{reviewError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setReviewRequest(null)} disabled={!!processingId} className="rounded-lg border border-gray-300 px-4 py-2">Cancel</button><button onClick={saveAndApprove} disabled={!!processingId} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50">{processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Save & Approve</button></div>
          </div>
        </div>
      )}

      {/* Financial Requests */}
      {activeTab === 'financial' && canApproveFinancial && (
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
