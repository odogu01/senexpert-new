'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Plus, X, ChevronLeft, ChevronRight, Eye, Edit, Trash2, HelpCircle } from 'lucide-react';
import { getTools, deleteTool, createTool, updateTool } from '@/services/toolsService';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { Tool, ToolStatus, ToolInsert, ToolUpdate } from '@/lib/database.types';

export default function InventoryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ToolStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editForm, setEditForm] = useState<ToolInsert>({
    name: '',
    work_order_number: '',
    category: 'General',
    quantity: 0,
    status: 'available',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTools();
  }, []);

  async function loadTools() {
    setLoading(true);
    try {
      const response = await getTools();
      if (response.success && response.data) {
        setTools(response.data);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    return [...new Set(tools.map(tool => tool.category).filter(Boolean))];
  }, [tools]);

  const locations = useMemo(() => {
    return [...new Set(tools.map(tool => tool.location).filter(Boolean))];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.model?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (tool.part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
      const matchesLocation = locationFilter === 'all' || tool.location === locationFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
    });
  }, [tools, searchQuery, statusFilter, categoryFilter, locationFilter]);

  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const paginatedTools = filteredTools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all';

  const handleDeleteTool = async (id: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      const response = await deleteTool(id);
      if (response.success) {
        setTools(tools.filter(t => t.id !== id));
      }
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

  const handleSaveEdit = async () => {
    if (!editingTool) return;
    setSaving(true);
    try {
      const updates: ToolUpdate = {
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
      };

      const response = await updateTool(editingTool.id, updates);
      if (response.success) {
        setTools(tools.map(t => t.id === editingTool.id ? { ...t, ...updates } : t));
        setIsEditModalOpen(false);
        setEditingTool(null);
      }
    } catch (error) {
      console.error('Failed to update tool:', error);
    } finally {
      setSaving(false);
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
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tool Inventory</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Manage and track all your industrial tools</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] transition-colors text-sm lg:text-base">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Tool</span>
          </button>
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
        <span className="hidden sm:block">Showing {paginatedTools.length} of {filteredTools.length} tools</span>
        <span className="sm:hidden">{paginatedTools.length}/{filteredTools.length}</span>
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 hidden lg:table-header-group">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tool Name</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <span className="flex items-center gap-1">
                    W/O
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        Work Order Number
                      </span>
                    </div>
                  </span>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Size/Thread</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Model</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Part Number</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
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
                  <td colSpan={11} className="lg:hidden px-4 py-4">
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
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{tool.part_number || '-'}</td>
                  <td className="hidden lg:table-cell px-4 lg:px-6 py-3 lg:py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                      {tool.category}
                    </span>
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
                      <button
                        onClick={() => setSelectedTool(tool)}
                        className="p-2 text-gray-400 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(tool)}
                        className="p-2 text-gray-400 hover:text-[#0B3C6D] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTool(tool.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
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
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        Work Order Number (W/O)
                        <div className="group relative">
                          <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                            Work Order Number
                          </span>
                        </div>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editForm.work_order_number}
                      onChange={(e) => setEditForm({ ...editForm, work_order_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size/Thread</label>
                    <input
                      type="text"
                      value={editForm.size_thread}
                      onChange={(e) => setEditForm({ ...editForm, size_thread: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input
                      type="text"
                      value={editForm.material}
                      onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input
                      type="text"
                      value={editForm.part_number}
                      onChange={(e) => setEditForm({ ...editForm, part_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.min_quantity}
                      onChange={(e) => setEditForm({ ...editForm, min_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ToolStatus })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3C6D]/20"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}