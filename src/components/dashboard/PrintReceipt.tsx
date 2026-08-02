'use client';

import { useState, useEffect } from 'react';
import type { ToolRequest, Tool } from '@/lib/database.types';

interface PrintReceiptProps {
  request?: ToolRequest;
  tool?: Tool; // For direct tool additions (no request)
}

const COMPANY_DETAILS = [
  'KM 17, Aba/Port Harcourt Expressway beside Ferotex Const. Co Ltd',
  'Portharcourt, Rivers State',
  'Email: senexpertglobal@gmail.com',
  'website: www.senexpertglobal.com',
];

export default function PrintReceipt({ request, tool }: PrintReceiptProps) {
  // Determine if this is from a request or a direct tool
  const isTool = !!tool;
  const req = request as unknown as Record<string, string> | undefined;

  // ── Build table rows ──
  const toolRows: { sn: number; description: string; quantity: number; remark: string }[] = [];

  if (isTool && tool) {
    // Direct tool addition — single row
    const parts = [tool.name, tool.size_thread, tool.material,
      tool.work_order_number ? `W/O:${tool.work_order_number}` : null,
      tool.material_no ? `Mat No:${tool.material_no}` : null,
      tool.part_number ? `Part No:${tool.part_number}` : null].filter(Boolean);
    toolRows.push({ sn: 1, description: parts.join('; ') || 'N/A', quantity: tool.quantity, remark: tool.description || '-' });
  } else if (request) {
    const items = (request as any).items as Array<{
      tool_name?: string; size_thread?: string; material?: string; model?: string;
      quantity: number; work_order_number?: string; material_no?: string; part_number?: string;
    }> | undefined;

    const descParts = (...vals: (string | undefined | null)[]) =>
      vals.filter(v => v && v !== 'N/A' && v !== 'n/a');

    const notes = request.notes || '-';
    if (items && items.length > 0) {
      items.forEach((item, i) => {
        const parts = descParts(item.tool_name, item.size_thread, item.material,
          item.work_order_number ? `W/O:${item.work_order_number}` : null,
          item.material_no ? `Mat No:${item.material_no}` : null,
          item.part_number ? `Part No:${item.part_number}` : null);
        toolRows.push({ sn: i + 1, description: parts.join('; ') || 'N/A', quantity: item.quantity, remark: notes });
      });
    } else if (request.tool_name) {
      const desc = [request.tool_name, req?.size_thread, req?.material].filter(Boolean).join('; ');
      toolRows.push({ sn: 1, description: desc || 'N/A', quantity: request.quantity, remark: notes });
    }
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // Transaction date (from created_at of the tool/request)
  const txDate = (() => {
    const raw = isTool ? tool?.created_at : request?.created_at;
    if (!raw) return today;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return today;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  // ── Party info ──
  const isOutgoing = isTool ? false : request?.movement_type === 'outgoing';
  const partyLabel = isOutgoing ? 'To' : 'From';
  const partyName = isOutgoing
    ? (req?.delivered_to || '-')
    : isTool
      ? (tool?.received_from || '-')
      : (req?.received_from || '-');

  // ── Persist editable fields per transaction ──
  const txId = (isTool ? tool?.id : request?.id) || 'new';
  const storageKey = (field: string) => `print_receipt_${field}_${txId}`;
  const ls = (key: string, def: string) => typeof window !== 'undefined' ? (localStorage.getItem(key) ?? def) : def;

  const [receivedBy, setReceivedBy] = useState(ls(storageKey('received_by'), ''));
  const [poNo, setPoNo] = useState(ls(storageKey('po_no'), ''));
  const [contractNo, setContractNo] = useState(ls(storageKey('contract_no'), ''));

  // Persist to localStorage whenever values change
  useEffect(() => { localStorage.setItem(storageKey('received_by'), receivedBy); }, [receivedBy, txId]);
  useEffect(() => { localStorage.setItem(storageKey('po_no'), poNo); }, [poNo, txId]);
  useEffect(() => { localStorage.setItem(storageKey('contract_no'), contractNo); }, [contractNo, txId]);

  return (
    <>
    <div className="print-receipt max-w-2xl mx-auto text-xs leading-tight flex flex-col">
      {/* Company Header */}
      <div className="text-center border-b border-gray-300 pb-0.5 mb-0.5">
        <img src="/title-logo.png" alt="SenExpert Global" className="w-10 h-auto mx-auto mb-0.5" />
        <h1 className="text-sm font-bold text-gray-900">SenExpert Global Energies</h1>
        <p className="text-xs text-gray-500">Receipt</p>
      </div>

      {/* Ref + Po No + Contract No + Company Details */}
      <div className="flex justify-between items-start mb-0.5">
        <div className="space-y-px">
          <div>
            <span className="font-semibold text-gray-700">Ref: </span>
            <span className="text-gray-900 font-medium">#{(isTool ? (tool?.id || '') : (request?.id || '')).toString().slice(0, 8) || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-700 text-[10px]">Po No:</span>
            <input
              type="text"
              value={poNo}
              onChange={e => setPoNo(e.target.value)}
              placeholder="_________________"
              className="flex-1 border-0 text-xs text-gray-900 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-700 text-[10px]">Contract No:</span>
            <input
              type="text"
              value={contractNo}
              onChange={e => setContractNo(e.target.value)}
              placeholder="_________________"
              className="flex-1 border-0 text-xs text-gray-900 bg-transparent"
            />
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-600 leading-tight max-w-[240px]">
          {COMPANY_DETAILS.map((line, i) => (
            <p key={i} className="break-words">{line}</p>
          ))}
        </div>
      </div>

      {/* To/From */}
      <div className="mb-0.5">
        <span className="font-semibold text-gray-700">{partyLabel}: </span>
        <span className="text-gray-900 font-medium">{partyName}</span>
      </div>

      {/* DELIVERY MEMO */}
      <div className="text-center font-bold text-xs text-gray-800 mb-0.5 uppercase tracking-wide">Delivery Memo / Waybill</div>

      {/* Tools Table */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-[#0B3C6D] text-white">
            <th className="px-1.5 py-1 text-left text-[10px] font-semibold uppercase w-10 border border-gray-300">S/N</th>
            <th className="px-1.5 py-1 text-left text-[10px] font-semibold uppercase border border-gray-300">Description of Item</th>
            <th className="px-1.5 py-1 text-center text-[10px] font-semibold uppercase w-14 border border-gray-300">Qty</th>
            <th className="px-1.5 py-1 text-left text-[10px] font-semibold uppercase border border-gray-300">Remark</th>
          </tr>
        </thead>
        <tbody>
          {toolRows.map(row => (
            <tr key={row.sn} className="even:bg-gray-50">
              <td className="px-1.5 py-0.5 text-gray-900 font-medium border border-gray-300">{row.sn}</td>
              <td className="px-1.5 py-0.5 text-gray-800 border border-gray-300">{row.description}</td>
              <td className="px-1.5 py-0.5 text-center text-gray-900 font-medium border border-gray-300">{row.quantity}</td>
              <td className="px-1.5 py-0.5 text-gray-600 text-[10px] border border-gray-300">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="signature-section border-t border-gray-300 pt-2">
        <div className="space-y-px">
          {/* Row 1: Requested By + Received By */}
          <div className="grid grid-cols-2 gap-x-6">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">Requested By:</span>
              <span className="text-gray-900 text-xs">
                {isTool ? (tool?.received_by || '-') : (req?.requester_name || req?.requested_by || '-')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">Received By:</span>
              <input
                type="text"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder="_________________________"
                className="flex-1 border-0 text-xs text-gray-900 bg-transparent"
              />
            </div>
          </div>

          {/* Row 2: Delivered by / Received from + Vehicle Number */}
          <div className="grid grid-cols-2 gap-x-6">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">
                {isOutgoing ? 'Delivered by:' : 'Received from:'}
              </span>
              <span className="text-gray-900 text-xs">
                {isTool ? (tool?.received_from || '-') : (req?.delivered_by || '-')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">Vehicle No:</span>
                <span className="text-gray-900 text-xs">
                  {isTool ? (tool?.vehicle_number || '-') : (req?.vehicle_no || '-')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-600 uppercase whitespace-nowrap">Date:</span>
                <span className="text-gray-900 text-xs">{txDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature / Date */}
        <div className="grid grid-cols-2 gap-x-6 mt-0.5 pt-0.5 border-t border-gray-200">
          <div>
            <span className="text-[10px] font-semibold text-gray-600 uppercase">Signature / Date: </span>
            <span className="text-gray-900 text-[10px]">_________________________________</span>
            <span className="text-gray-500 ml-1 text-[10px]">({today})</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-gray-600 uppercase">Signature / Date: </span>
            <span className="text-gray-900 text-[10px]">_________________________________</span>
            <span className="text-gray-500 ml-1 text-[10px]">({today})</span>
          </div>
        </div>
      </div>
    </div>

    {/* REJECTED watermark */}
    {request?.status === 'rejected' && (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center" style={{ transform: 'rotate(-30deg)' }}>
        <span className="text-[120px] font-bold text-red-600/20 select-none">REJECTED</span>
      </div>
    )}
    </>);
}
