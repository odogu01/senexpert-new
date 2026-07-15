'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Package, Wrench } from 'lucide-react';
import { useToolsPaginated } from '@/hooks/api';
import StatusBadge from '@/components/dashboard/StatusBadge';
import PaginationBar from '@/components/dashboard/PaginationBar';
import type { Tool } from '@/lib/database.types';

export default function LowStockPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data, isLoading, isError } = useToolsPaginated({
    lowStock: true,
    page: currentPage,
    limit: itemsPerPage,
    sort: 'quantity',
  });

  const tools = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Low Stock Tools</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Tools with quantity at or below their minimum threshold
          </p>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && !isError && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>
            <strong className="text-red-700">{total}</strong> tool{total !== 1 ? 's' : ''} currently below minimum stock level
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B3C6D]" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-500 mb-2">Failed to load low stock tools</p>
          <button
            onClick={() => router.refresh()}
            className="text-sm text-[#0B3C6D] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tool Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Min Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tools.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No low stock tools found.</p>
                      </td>
                    </tr>
                  ) : (
                    tools.map((tool: Tool, i: number) => (
                      <motion.tr
                        key={tool.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tool.category}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-red-600">{tool.quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {tool.min_quantity ?? 1}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={tool.status} />
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
