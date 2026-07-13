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
    quantity: number;
  }> | undefined;

  // Build table rows
  const notes = request.notes || '-';
  const toolRows: { sn: number; description: string; quantity: number; remark: string }[] = [];
  if (items && items.length > 0) {
    items.forEach((item, i) => {
      const desc = [item.tool_name, item.size_thread, item.material].filter(Boolean).join(' / ');
      toolRows.push({ sn: i + 1, description: desc || 'N/A', quantity: item.quantity, remark: notes });
    });
  } else if (request.tool_name) {
    const desc = [request.tool_name, r.size_thread, r.material].filter(Boolean).join(' / ');
    toolRows.push({ sn: 1, description: desc || 'N/A', quantity: request.quantity, remark: notes });
  }

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const isOutgoing = request.movement_type === 'outgoing';
  const partyLabel = isOutgoing ? 'To' : 'From';
  const partyName = isOutgoing ? (r.delivered_to || '-') : (r.received_from || '-');
  const clientLabel = isOutgoing ? 'Client Name' : 'Received From';

  // Editable signature fields
  const [clientRep, setClientRep] = useState('');
  const [clientDesig, setClientDesig] = useState('');
  const [senexpertRep, setSenexpertRep] = useState('');
  const [senexpertDesig, setSenexpertDesig] = useState('');
  const [driverName, setDriverName] = useState('');

  return (
    <div className="print-receipt max-w-2xl mx-auto text-sm leading-relaxed">
      {/* Company Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-4">
        <img src="/title-logo.png" alt="SenExpert Global" className="w-20 h-auto mx-auto mb-2" />
        <h1 className="text-xl font-bold text-gray-900">SenExpert Global Energies</h1>
        <p className="text-xs text-gray-500">Receipt</p>
      </div>

      {/* Ref + Company Details + Date */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="font-semibold text-gray-700">Ref: </span>
          <span className="text-gray-900 font-medium">{request.ref_number || 'N/A'}</span>
        </div>
        <div className="text-right text-xs text-gray-600 leading-relaxed max-w-[260px]">
          {COMPANY_DETAILS.map((line, i) => (
            <p key={i} className="break-words">{line}</p>
          ))}
          <div className="mt-1">
            <span className="text-gray-500">Date: </span>
            <span className="text-gray-900 font-medium text-sm">{today}</span>
          </div>
        </div>
      </div>

      {/* To/From */}
      <div className="mb-4">
        <span className="font-semibold text-gray-700">{partyLabel}: </span>
        <span className="text-gray-900 font-medium">{partyName}</span>
      </div>

      {/* Tools Table */}
      <table className="w-full border-collapse mb-5">
        <thead>
          <tr className="bg-[#0B3C6D] text-white">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase w-12">S/N</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Description of Item</th>
            <th className="px-3 py-2 text-center text-xs font-semibold uppercase w-16">Quantity</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Remark</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {toolRows.map(row => (
            <tr key={row.sn} className="even:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-900 font-medium">{row.sn}</td>
              <td className="px-3 py-2.5 text-gray-800">{row.description}</td>
              <td className="px-3 py-2.5 text-center text-gray-900 font-medium">{row.quantity}</td>
              <td className="px-3 py-2.5 text-gray-600 text-xs">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Client Name */}
      <div className="mb-5">
        <span className="font-semibold text-gray-700">{clientLabel}: </span>
        <span className="text-gray-900 font-medium border-b border-gray-400 px-2 pb-0.5">{partyName}</span>
      </div>

      {/* Vehicle Number */}
      <div className="mb-6">
        <span className="font-semibold text-gray-700">Vehicle Number: </span>
        <span className="text-gray-900 font-medium border-b border-gray-400 px-2 pb-0.5">{r.vehicle_no || '-'}</span>
      </div>

      {/* Signature Section */}
      <div className="border-t border-gray-300 pt-5">
        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          {/* Client Rep */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Client Rep</label>
            <input
              type="text"
              value={clientRep}
              onChange={e => setClientRep(e.target.value)}
              placeholder="_________________________"
              className="w-full border-0 border-b border-gray-400 pb-1 text-sm text-gray-900 bg-transparent no-print"
            />
            <span className="print-only text-gray-900 border-b border-black min-w-[180px] inline-block">{clientRep || '_________________________'}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Designation</label>
            <input
              type="text"
              value={clientDesig}
              onChange={e => setClientDesig(e.target.value)}
              placeholder="_________________________"
              className="w-full border-0 border-b border-gray-400 pb-1 text-sm text-gray-900 bg-transparent no-print"
            />
            <span className="print-only text-gray-900 border-b border-black min-w-[180px] inline-block">{clientDesig || '_________________________'}</span>
          </div>

          {/* Senexpert Rep */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Senexpert Rep</label>
            <input
              type="text"
              value={senexpertRep}
              onChange={e => setSenexpertRep(e.target.value)}
              placeholder="_________________________"
              className="w-full border-0 border-b border-gray-400 pb-1 text-sm text-gray-900 bg-transparent no-print"
            />
            <span className="print-only text-gray-900 border-b border-black min-w-[180px] inline-block">{senexpertRep || '_________________________'}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Designation</label>
            <input
              type="text"
              value={senexpertDesig}
              onChange={e => setSenexpertDesig(e.target.value)}
              placeholder="_________________________"
              className="w-full border-0 border-b border-gray-400 pb-1 text-sm text-gray-900 bg-transparent no-print"
            />
            <span className="print-only text-gray-900 border-b border-black min-w-[180px] inline-block">{senexpertDesig || '_________________________'}</span>
          </div>

          {/* Driver's Name */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Driver&apos;s Name</label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              placeholder="_________________________"
              className="w-full max-w-xs border-0 border-b border-gray-400 pb-1 text-sm text-gray-900 bg-transparent no-print"
            />
            <span className="print-only text-gray-900 border-b border-black min-w-[180px] inline-block">{driverName || '_________________________'}</span>
          </div>
        </div>

        {/* Signature / Date */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-3 mt-8 pt-4 border-t border-gray-200">
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

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>Generated by SenExpert Global Energies - SEG System</p>
      </div>
    </div>
  );
}
