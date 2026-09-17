'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, AlertTriangle, Calendar, Ban, X, Loader2, Plus } from 'lucide-react';
import { useMaintenance, useCreateMaintenance, useProfile, useTools } from '@/hooks/api';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { Maintenance } from '@/lib/database.types';

export default function MaintenancePage() {
  const { data: records = [] } = useMaintenance();
  const { data: tools = [] } = useTools();
  const { data: profile } = useProfile();
  const { mutateAsync: createMaintenance, isPending: isScheduling } = useCreateMaintenance();

  const userRole = profile?.role ?? null;
  const canSchedule = userRole && ['super_admin', 'admin', 'operator'].includes(userRole);

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    maintenance_type: 'calibration' as 'calibration' | 'repairs' | 'threading' | 'other',
    other_maintenance_type: '',
    description: '',
    scheduled_date: '',
    notes: '',
  });
  interface MaintenanceToolEntry { key: string; toolId: string; }
  const [toolEntries, setToolEntries] = useState<MaintenanceToolEntry[]>([]);
  const toolEntryCounter = useRef(0);

  const addToolEntry = () => {
    toolEntryCounter.current += 1;
    setToolEntries(entries => [...entries, { key: `maintenance-tool-${toolEntryCounter.current}`, toolId: '' }]);
  };

  const updateToolEntry = (key: string, toolId: string) => {
    setToolEntries(entries => entries.map(entry => entry.key === key ? { ...entry, toolId } : entry));
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
    setFormData({
      maintenance_type: 'calibration', other_maintenance_type: '', description: '', scheduled_date: '', notes: '',
    });
    setToolEntries([]);
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const toolIds = toolEntries.map(entry => entry.toolId).filter(Boolean);
    if (!toolIds.length || toolIds.length !== toolEntries.length) {
      setFormError('Select a tool in every row, or remove the empty row.');
      return;
    }
    if (new Set(toolIds).size !== toolIds.length) {
      setFormError('Each tool can be scheduled only once in the same maintenance request.');
      return;
    }
    const maintenanceType = formData.maintenance_type === 'other'
      ? formData.other_maintenance_type.trim()
      : formData.maintenance_type;
    if (!maintenanceType) {
      setFormError('Enter the different maintenance type.');
      return;
    }
    try {
      await createMaintenance({
        ...formData,
        maintenance_type: maintenanceType,
        tool_ids: toolIds,
      });
      closeModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to schedule maintenance. Please try again.');
    }
  };

  const stats = [
    { label: 'In Progress', value: (records as Maintenance[]).filter(r => r.status === 'in_progress').length, icon: Wrench, color: 'bg-blue-100 text-blue-600' },
    { label: 'Scheduled', value: (records as Maintenance[]).filter(r => r.status === 'scheduled').length, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: (records as Maintenance[]).filter(r => r.status === 'completed').length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Overdue', value: 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">Track and manage tool maintenance</p>
        </div>
        {canSchedule ? (
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-[#0B3C6D] text-white rounded-lg hover:bg-[#0a325a] text-sm">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Maintenance</span>
            <span className="sm:hidden">Schedule</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Ban className="w-4 h-4" />
            <span>You do not have permission to schedule maintenance</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-bold text-gray-800">{stat.value}</p><p className="text-sm text-gray-500">{stat.label}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Maintenance Records</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(records as Maintenance[]).length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No maintenance records found</p></td></tr>
              ) : (
                (records as Maintenance[]).map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{tools.find(tool => tool.id === record.tool_id)?.name || record.tool_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{record.maintenance_type}</td>
                    <td className="px-6 py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Schedule Maintenance</h2>
                <p className="mt-1 text-sm text-gray-500">Choose one or more tools and the maintenance work to be performed.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close schedule maintenance form">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSchedule} className="space-y-4 p-5">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">Tools ({toolEntries.length})</span>
                  <button type="button" onClick={addToolEntry} className="flex items-center gap-1 rounded-lg bg-[#0B3C6D] px-3 py-1.5 text-xs text-white hover:bg-[#0a325a]">
                    <Plus className="h-3.5 w-3.5" /> Add Tool
                  </button>
                </div>
                {toolEntries.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">Click “Add Tool” to choose tools for this maintenance schedule.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {toolEntries.map((entry, index) => (
                      <div key={entry.key} className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Tool #{index + 1}</span>
                          <button type="button" onClick={() => setToolEntries(entries => entries.filter(item => item.key !== entry.key))} className="rounded p-1 text-gray-400 hover:text-red-500" aria-label={`Remove tool ${index + 1}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <select value={entry.toolId} onChange={event => updateToolEntry(entry.key, event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required>
                          <option value="">Select tool...</option>
                          {tools.map(tool => {
                            const selectedInAnotherRow = toolEntries.some(item => item.key !== entry.key && item.toolId === tool.id);
                            return <option key={tool.id} value={tool.id} disabled={selectedInAnotherRow}>{tool.name}{tool.size_thread ? ` — ${tool.size_thread}` : ''}{tool.work_order_number ? ` — W/O: ${tool.work_order_number}` : ''}{tool.location ? ` (${tool.location})` : ''}</option>;
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="maintenance-type" className="mb-1 block text-sm font-medium text-gray-700">Maintenance type</label>
                  <select id="maintenance-type" value={formData.maintenance_type} onChange={event => setFormData({ ...formData, maintenance_type: event.target.value as typeof formData.maintenance_type })} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="calibration">Calibration</option><option value="repairs">Repairs</option><option value="threading">Threading</option><option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="maintenance-date" className="mb-1 block text-sm font-medium text-gray-700">Scheduled date</label>
                  <input id="maintenance-date" type="date" min={new Date().toISOString().slice(0, 10)} value={formData.scheduled_date} onChange={event => setFormData({ ...formData, scheduled_date: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
                </div>
              </div>
              {formData.maintenance_type === 'other' && (
                <div>
                  <label htmlFor="other-maintenance-type" className="mb-1 block text-sm font-medium text-gray-700">Different maintenance type</label>
                  <input id="other-maintenance-type" value={formData.other_maintenance_type} onChange={event => setFormData({ ...formData, other_maintenance_type: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter the maintenance type" required />
                </div>
              )}
              <div>
                <label htmlFor="maintenance-description" className="mb-1 block text-sm font-medium text-gray-700">Work description</label>
                <textarea id="maintenance-description" value={formData.description} onChange={event => setFormData({ ...formData, description: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} placeholder="Describe the inspection, repair, or other work needed" required />
              </div>
              <div>
                <label htmlFor="maintenance-notes" className="mb-1 block text-sm font-medium text-gray-700">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <input id="maintenance-notes" value={formData.notes} onChange={event => setFormData({ ...formData, notes: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Additional details" />
              </div>
              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isScheduling} className="flex items-center gap-2 rounded-lg bg-[#0B3C6D] px-4 py-2 text-sm text-white hover:bg-[#0a325a] disabled:opacity-50">
                  {isScheduling && <Loader2 className="h-4 w-4 animate-spin" />} Schedule Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
