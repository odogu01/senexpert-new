'use client';

import { useState } from 'react';
import type { ToolRequest } from '@/lib/database.types';

interface PrintReceiptProps {
  request: ToolRequest;
}

const COMPANY_DETAILS = [
  'KM 17, Aba/Port Harcourt Expressway beside Ferotex Const. Co Ltd',
  'Portharcourt, Rivers State',
  'Email: senexpertglobal@gmail.com',
  'website: www.senexpertglobal.com',
];

export default function PrintReceipt({ request }: PrintReceiptProps) {
  const r = request as unknown as Record<string, string>;
  const items = (request as any).items as Array<{
    tool_name?: string;
    size_thread?: string;
    material?: string;
    model?: string;
    quantity: number;
    work_order_number?: string;
    material_no?: string;
    part_number?: string;
  }> | undefined;

  // Helper to build description parts skipping N/A values
  const descParts = (...vals: (string | undefined | null)[]) =>
    vals.filter(v => v && v !== 'N/A' && v !== 'n/a');

  // Build table rows
  const notes = request.notes || '-';
  const toolRows: { sn: number; description: string; quantity: number; remark: string }[] = [];
  if (items && items.length > 0) {
    items.forEach((item, i) => {
      const parts = descParts(item.tool_name, item.size_thread, item.material,
        item.work_order_number ? `W/O:${item.work_order_number}` : null,
        item.material_no ? `Mat No:${item.material_no}` : null,
        item.part_number ? `Part No:${item.part_number}` : null);
      toolRows.push({ sn: i + 1, description: parts.join('; ') || 'N/A', quantity: item.quantity, remark: notes });
    });
  } else if (request.tool_name) {
    const desc = [request.tool_name, r.size_thread, r.material].filter(Boolean).join('; ');
    toolRows.push({ sn: 1, description: desc || 'N/A', quantity: request.quantity, remark: notes });
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const isOutgoing = request.movement_type === 'outgoing';
  const partyLabel = isOutgoing ? 'To' : 'From';
  const partyName = isOutgoing ? (r.delivered_to || '-') : (r.received_from || '-');
  // Editable fields
  const [receivedBy, setReceivedBy] = useState('');
  const [poNo, setPoNo] = useState('');
  const [contractNo, setContractNo] = useState('');

  return (
    <>
    <div className="print-receipt max-w-2xl mx-auto text-sm leading-relaxed flex flex-col min-h-screen">
      {/* Company Header */}
      <div className="text-center border-b border-gray-300 pb-2 mb-2">
        <img src="/title-logo.png" alt="SenExpert Global" className="w-16 h-auto mx-auto mb-1" />
        <h1 className="text-lg font-bold text-gray-900">SenExpert Global Energies</h1>
        <p className="text-xs text-gray-500">Receipt</p>
      </div>

      {/* Ref + Po No + Contract No + Company Details */}
      <div className="flex justify-between items-start mb-2">
        <div className="space-y-0.5">
          <div>
            <span className="font-semibold text-gray-700">Ref: </span>
            <span className="text-gray-900 font-medium">#{request.id?.slice(0, 8) || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-xs">Po No:</span>
            <input
              type="text"
              value={poNo}
              onChange={e => setPoNo(e.target.value)}
              placeholder="_________________"
              className="border-0 text-sm text-gray-900 bg-transparent no-print flex-1"
            />
            <span className="print-only text-gray-900 text-xs">{poNo || '_________________'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 text-xs">Contract No:</span>
            <input
              type="text"
              value={contractNo}
              onChange={e => setContractNo(e.target.value)}
              placeholder="_________________"
              className="border-0 text-sm text-gray-900 bg-transparent no-print flex-1"
            />
            <span className="print-only text-gray-900 text-xs">{contractNo || '_________________'}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-600 leading-relaxed max-w-[260px]">
          {COMPANY_DETAILS.map((line, i) => (
            <p key={i} className="break-words">{line}</p>
          ))}
        </div>
      </div>

      {/* To/From */}
      <div className="mb-2">
        <span className="font-semibold text-gray-700">{partyLabel}: </span>
        <span className="text-gray-900 font-medium">{partyName}</span>
      </div>

      {/* DELIVERY MEMO */}
      <div className="text-center font-bold text-sm text-gray-800 mb-1 uppercase tracking-wide">Delivery Memo / Waybill</div>

      {/* Tools Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-[#0B3C6D] text-white">
            <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase w-12 border border-gray-300">S/N</th>
            <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase border border-gray-300">Description of Item</th>
            <th className="px-2 py-1.5 text-center text-xs font-semibold uppercase w-16 border border-gray-300">Quantity</th>
            <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase border border-gray-300">Remark</th>
          </tr>
        </thead>
        <tbody>
          {toolRows.map(row => (
            <tr key={row.sn} className="even:bg-gray-50">
              <td className="px-2 py-2 text-gray-900 font-medium border border-gray-300">{row.sn}</td>
              <td className="px-2 py-2 text-gray-800 border border-gray-300">{row.description}</td>
              <td className="px-2 py-2 text-center text-gray-900 font-medium border border-gray-300">{row.quantity}</td>
              <td className="px-2 py-2 text-gray-600 text-xs border border-gray-300">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Spacer — fills remaining page space to push signature to bottom */}
      <div className="flex-1" />

      {/* Signature Section */}
      <div className="border-t border-gray-300 pt-8 mt-4">
        <div className="space-y-0.5">
          {/* Row 1: Requested By + Received By */}
          <div className="grid grid-cols-2 gap-x-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Requested By:</span>
              <span className="text-gray-900 text-sm">{r.requester_name || r.requested_by || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Received By:</span>
              <input
                type="text"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder="_________________________"
                className="flex-1 border-0 text-sm text-gray-900 bg-transparent no-print"
              />
              <span className="print-only text-gray-900">{receivedBy || '_________________________'}</span>
            </div>
          </div>

          {/* Row 2: Delivered by + Vehicle Number */}
          <div className="grid grid-cols-2 gap-x-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Delivered by:</span>
              <span className="text-gray-900 text-sm">{r.delivered_by || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Vehicle Number:</span>
              <span className="text-gray-900 text-sm">{r.vehicle_no || '-'}</span>
            </div>
          </div>
        </div>

        {/* Signature / Date */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-1 mt-[10px] pt-[4px] border-t border-gray-200">
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Signature / Date: </span>
            <span className="text-gray-900">_________________________________</span>
            <span className="text-gray-500 ml-2 text-xs">({today})</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Signature / Date: </span>
            <span className="text-gray-900">_________________________________</span>
            <span className="text-gray-500 ml-2 text-xs">({today})</span>
          </div>
        </div>
      </div>
    </div>

    {/* REJECTED watermark */}
    {request.status === 'rejected' && (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center" style={{ transform: 'rotate(-30deg)' }}>
        <span className="text-[120px] font-bold text-red-600/20 select-none">REJECTED</span>
      </div>
    )}
    </>);
}
