'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Plus, X, ChevronLeft, ChevronRight, Eye, Edit, Trash2, HelpCircle, Printer } from 'lucide-react';
import { useToolsPaginated, useCategories, useLocations, useCreateTool, useUpdateTool, useDeleteTool, useProfile } from '@/hooks/api';
import { getAuthHeaders } from '@/lib/query';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { Tool, ToolStatus, ToolInsert } from '@/lib/database.types';

export default function InventoryPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutateAsync: createTool } = useCreateTool();
  const { mutateAsync: updateTool } = useUpdateTool();
  const { mutateAsync: deleteTool } = useDeleteTool();

  const userRole = profile?.role ?? null;
  const currentUserId = profile?.id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editForm, setEditForm] = useState<ToolInsert>({
    name: '',
    work_order_number: '',
    category: 'Saleable',
    quantity: 1,
    status: 'available',
    material_no: '',
    received_from: '',
    received_by: '',
    vehicle_number: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [printTool, setPrintTool] = useState<Tool | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  // Permission checks
  const canViewAllInventory = userRole === 'super_admin' || userRole === 'admin';
  const canAddTool = userRole === 'super_admin' || userRole === 'admin' || userRole === 'operator';
  const canEditTool = userRole === 'super_admin' || userRole === 'admin';
  const canDeleteTool = userRole === 'super_admin' || userRole === 'admin';

  // ───── Admin: categories/locations for filter dropdowns (lightweight distinct queries) ─────
  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();

  // ───── Operator: fetch their tools (runs only for non-admin roles) ─────
  const { data: operatorAllTools = [], isLoading: operatorToolsLoading } = useQuery({
    queryKey: ['tools', 'operator', currentUserId],
    queryFn: async () => {
      const res = await fetch('/api/tools', { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch tools');
      return json.data as Tool[] ?? [];
    },
    enabled: !canViewAllInventory && !!currentUserId && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    staleTime: 5 * 60 * 1000,
  });

  const operatorTools = useMemo(() => {
    if (canViewAllInventory) return [];
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return operatorAllTools.filter(tool => {
      const createdAt = tool.created_at ? new Date(tool.created_at) : null;
      return createdAt && createdAt > fourHoursAgo && tool.created_by === currentUserId;
    });
  }, [operatorAllTools, canViewAllInventory, currentUserId]);

  // ───── Admin: server-paginated data for main table ─────
  const paginatedFilters = useMemo(() => {
    if (!canViewAllInventory) return undefined;
    return {
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      location: locationFilter !== 'all' ? locationFilter : undefined,
      page: currentPage,
      limit: itemsPerPage,
    };
  }, [canViewAllInventory, searchQuery, statusFilter, categoryFilter, locationFilter, currentPage]);
  const { data: paginated, isLoading: paginatedLoading } = useToolsPaginated(paginatedFilters);

  // Admins: server-paginated tools. Operators: client-paginated from operatorTools.
  const paginatedTools = useMemo(() => {
    if (canViewAllInventory) return paginated?.data ?? [];
    return operatorTools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [canViewAllInventory, paginated, operatorTools, currentPage]);

  const totalResults = canViewAllInventory ? (paginated?.total ?? 0) : operatorTools.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

  // ───── Admin: server-paginated receiving history (independent of main table) ─────
  const { data: receivingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['tools', 'receiving-history', historyPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(historyPage), limit: String(itemsPerPage) });
      const res = await fetch(`/api/tools?${params}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to fetch receiving history');
      return { data: json.data as Tool[] ?? [], total: json.total as number ?? 0 };
    },
    enabled: canViewAllInventory && typeof window !== 'undefined' && !!localStorage.getItem('senexpert_token'),
    staleTime: 5 * 60 * 1000,
  });

  const historyTools = canViewAllInventory ? (receivingHistory?.data ?? []) : operatorTools;
  const historyTotal = canViewAllInventory ? (receivingHistory?.total ?? 0) : operatorTools.length;
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / itemsPerPage));

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setCurrentPage(1);
  }, []);

  const handleDeleteTool = async (id: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      await deleteTool(id);
    }
  };

  const openEditModal = (tool: Tool) => {
    setEditingTool(tool);
    setEditForm({
      name: tool.name,
      work_order_number: tool.work_order_number,
      size_thread: tool.size_thread || '',
      material: tool.material || '',
      model: tool.model || '',
      part_number: tool.part_number || '',
      category: tool.category,
      quantity: tool.quantity,
      min_quantity: tool.min_quantity || 1,
      status: tool.status,
      location: tool.location || '',
      description: tool.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAddNewTool = async () => {
    if (!editForm.name || !editForm.work_order_number || !currentUserId) return;
    setSaving(true);
    try {
      await createTool({
        name: editForm.name,
        work_order_number: editForm.work_order_number,
        size_thread: editForm.size_thread,
        material: editForm.material,
        model: editForm.model,
        part_number: editForm.part_number,
        material_no: editForm.material_no,
        category: editForm.category || 'General',
        quantity: editForm.quantity,
        min_quantity: editForm.min_quantity,
        status: editForm.status,
        location: editForm.location,
        description: editForm.description,
        created_by: currentUserId,
        received_from: editForm.received_from,
        received_by: editForm.received_by,
        vehicle_number: editForm.vehicle_number,
      });
      setIsAddModalOpen(false);
      setEditForm({
        name: '',
        work_order_number: '',
        category: 'Saleable',
        quantity: 1,
        status: 'available',
        material_no: '',
        received_from: '',
        received_by: '',
        vehicle_number: '',
      });
    } catch (err) {
      console.error('Failed to add tool:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTool) return;
    setSaving(true);
    try {
      await updateTool({
        id: editingTool.id,
        data: {
          name: editForm.name,
          work_order_number: editForm.work_order_number,
          size_thread: editForm.size_thread,
          material: editForm.material,
          model: editForm.model,
          part_number: editForm.part_number,
          category: editForm.category,
          quantity: editForm.quantity,
          min_quantity: editForm.min_quantity,
          status: editForm.status,
          location: editForm.location,
          description: editForm.description,
        },
      });
      setIsEditModalOpen(false);
      setEditingTool(null);
    } catch (err) {
      console.error('Failed to update tool:', err);
    } finally {
      setSaving(false);
    }
  };

  const loading = profileLoading || (canViewAllInventory ? paginatedLoading : operatorToolsLoading);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tool Inventory</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Manage and track all your industrial tools</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {canAddTool && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors text-sm lg:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Tool</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
          <div className="relative w-full sm:flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ToolStatus | 'all'); setCurrentPage(1); }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C6D]/20"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs lg:text-sm text-gray-500">
        {canViewAllInventory ? (
          <>
            <span className="hidden sm:block">Showing {paginatedTools.length} of {totalResults} tools</span>
            <span className="sm:hidden">{paginatedTools.length}/{totalResults}</span>
          </>
        ) : (
          <>
            <span className="hidden sm:block">Showing {operatorTools.length} tools</span>
            <span className="sm:hidden">{operatorTools.length}</span>
          </>
        )}
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tool Name</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    W/O
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none transition-opacity">
                        Work Order Number
                      </span>
                    </div>
                  </span>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Size/Thread</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Model</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Material No</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Part Number</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <span className="flex items-center gap-1">
                    IQ
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none transition-opacity">
                        Initial Quantity
                      </span>
                    </div>
                  </span>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTools.map((tool, index) => (
                <motion.tr
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td colSpan={12} className="lg:hidden px-4 py-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{tool.name}</p>
                          <p className="text-xs text-gray-500">W/O: {tool.work_order_number}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedTool(tool)} className="p-2 text-gray-500 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(tool)} className="p-2 text-gray-500 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteTool(tool.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {tool.size_thread && <span className="bg-gray-100 px-2 py-1 rounded">{tool.size_thread}</span>}
                        {tool.material && <span className="bg-gray-100 px-2 py-1 rounded">{tool.material}</span>}
                        <span className="bg-gray-100 px-2 py-1 rounded">{tool.category}</span>
                        {tool.model && <span className="bg-gray-100 px-2 py-1 rounded">{tool.model}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={tool.status} />
                        <span className="text-xs text-gray-500">{tool.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <p className="font-medium text-gray-800">{tool.name}</p>
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.work_order_number}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.size_thread || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.material || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.model || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.material_no || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.part_number || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${tool.category === 'Saleable' ? 'bg-green-100 text-green-700' : tool.category === 'Rental' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {tool.category}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <div className="text-sm font-medium text-gray-800">{tool.initial_quantity ?? tool.quantity}</div>
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <div className="text-sm font-medium text-gray-800">{tool.quantity}</div>
                    {tool.min_quantity && tool.quantity <= tool.min_quantity && (
                      <div className="text-xs text-red-500">Min: {tool.min_quantity}</div>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <StatusBadge status={tool.status} size="sm" />
                  </td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.location || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedTool(tool)} className="p-2 text-gray-400 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(tool)} className="p-2 text-gray-400 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTool(tool.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg ${
                    currentPage === page
                      ? 'bg-[#0B3C6D] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Receiving History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Receiving History</h2>
            <p className="text-sm text-gray-500">Record of all received tools</p>
          </div>
        </div>

        {historyTotal === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No receiving history yet. Add tools to see history here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tool Name</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Received From</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Received By</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle No</th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyTools.map((tool, index) => (
                    <motion.tr
                      key={tool.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 lg:px-6 py-3">
                        <p className="font-medium text-gray-800 text-sm">{tool.name}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">{tool.quantity}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">{tool.received_from || '-'}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">{tool.received_by || '-'}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">{tool.vehicle_number || '-'}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                        {tool.created_at ? new Date(tool.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right">
                        <button
                          onClick={() => setPrintTool(tool)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0B3C6D] bg-[#0B3C6D]/5 hover:bg-[#0B3C6D]/10 rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {historyTotal > itemsPerPage && (
              <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">{historyTotal} total records</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setHistoryPage(page)}
                      className={`w-7 h-7 text-xs rounded ${
                        historyPage === page ? 'bg-[#0B3C6D] text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tool Detail Modal */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTool(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTool.name}</h2>
                  <button onClick={() => setSelectedTool(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Work Order Number</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.work_order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Part Number</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.part_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Model</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Size/Thread</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.size_thread || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Material</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.material || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Category</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Quantity</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Location</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTool.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Status</p>
                    <StatusBadge status={selectedTool.status} />
                  </div>
                </div>
                {selectedTool.description && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Description</p>
                    <p className="text-sm text-gray-700">{selectedTool.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Tool Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Tool</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name *</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        Work Order Number (W/O)
                        <div className="group relative">
                          <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none transition-opacity">Work Order Number</span>
                        </div>
                      </span>
                    </label>
                    <input type="text" value={editForm.work_order_number} onChange={(e) => setEditForm({ ...editForm, work_order_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size/Thread</label>
                    <input type="text" value={editForm.size_thread} onChange={(e) => setEditForm({ ...editForm, size_thread: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input type="text" value={editForm.material} onChange={(e) => setEditForm({ ...editForm, material: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input type="text" value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input type="text" value={editForm.part_number} onChange={(e) => setEditForm({ ...editForm, part_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20">
                      <option value="Saleable">Saleable</option>
                      <option value="Rental">Rental</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" min="0" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                    <input type="number" min="0" value={editForm.min_quantity} onChange={(e) => setEditForm({ ...editForm, min_quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ToolStatus })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20">
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" rows={3} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Saving...</>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Tool Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Add New Tool</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name *</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Number (W/O) *</label>
                    <input type="text" value={editForm.work_order_number} onChange={(e) => setEditForm({ ...editForm, work_order_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size/Thread</label>
                    <input type="text" value={editForm.size_thread || ''} onChange={(e) => setEditForm({ ...editForm, size_thread: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input type="text" value={editForm.material || ''} onChange={(e) => setEditForm({ ...editForm, material: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input type="text" value={editForm.model || ''} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material No</label>
                    <input type="text" value={editForm.material_no || ''} onChange={(e) => setEditForm({ ...editForm, material_no: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input type="text" value={editForm.part_number || ''} onChange={(e) => setEditForm({ ...editForm, part_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20">
                      <option value="Saleable">Saleable</option>
                      <option value="Rental">Rental</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" min="1" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                    <input type="number" min="0" value={editForm.min_quantity || 1} onChange={(e) => setEditForm({ ...editForm, min_quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ToolStatus })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20">
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="rentals">Rentals</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={editForm.location || ''} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="e.g., Warehouse A, PFT" />
                  </div>
                  <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Receiving Details</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Received From</label>
                    <input type="text" value={editForm.received_from || ''} onChange={(e) => setEditForm({ ...editForm, received_from: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="e.g., Supplier name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                    <input type="text" value={editForm.received_by || ''} onChange={(e) => setEditForm({ ...editForm, received_by: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="e.g., Staff name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                    <input type="text" value={editForm.vehicle_number || ''} onChange={(e) => setEditForm({ ...editForm, vehicle_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" placeholder="e.g., ABC-1234" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleAddNewTool} disabled={saving || !editForm.name || !editForm.work_order_number} className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Adding...</>
                    ) : 'Add Tool'}
                  </button>
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
                    <img src="/title-logo.png" alt="SenExpert Global" className="w-20 h-auto mx-auto mb-2" />
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
