'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, ImagePlus, LoaderCircle, Trash2, Upload, Download } from 'lucide-react';
import type { Employee } from '@/lib/database.types';
import { getAuthHeaders, queryKeys, throwIfError } from '@/lib/query';

const MAX_BYTES = 10 * 1024 * 1024;

export default function EmployeeFiles({ employee }: { employee: Employee }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Employment document');
  const [photoUrl, setPhotoUrl] = useState('');

  const getPhotoUrl = async () => {
    const response = await fetch(`/api/employees/${employee.id}/asset-url?type=photo`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (data.success) setPhotoUrl(data.data.url);
  };
  useEffect(() => { if (employee.photo) void getPhotoUrl(); else setPhotoUrl(''); }, [employee.id, employee.photo?.public_id]);

  const upload = async (file: File, kind: 'photo' | 'document') => {
    setMessage('');
    const allowed = kind === 'photo' ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) { setMessage('Choose a JPG or PNG photo, or a PDF/JPG/PNG document.'); return; }
    if (!file.size || file.size > MAX_BYTES) { setMessage('Files must be smaller than 10 MB.'); return; }
    setBusy(true);
    try {
      const signatureResponse = await fetch(`/api/employees/${employee.id}/upload-signature`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ kind }) });
      const signed = throwIfError<any>(await signatureResponse.json());
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', signed.api_key);
      form.append('timestamp', String(signed.timestamp));
      form.append('signature', signed.signature);
      form.append('public_id', signed.public_id);
      form.append('type', signed.type);
      form.append('allowed_formats', signed.allowed_formats);
      const uploadedResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloud_name}/${signed.resource_type}/upload`, { method: 'POST', body: form });
      const uploaded = await uploadedResponse.json();
      if (!uploadedResponse.ok) throw new Error(uploaded.error?.message || 'Cloudinary upload failed');
      const savedResponse = await fetch(`/api/employees/${employee.id}/documents`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({
        kind, category, public_id: uploaded.public_id, version: uploaded.version, signature: uploaded.signature,
        resource_type: uploaded.resource_type, format: uploaded.format, bytes: uploaded.bytes, original_filename: file.name,
      }) });
      throwIfError(await savedResponse.json());
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employee.id) });
      setMessage(kind === 'photo' ? 'Profile photo uploaded.' : 'Document uploaded.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };

  const download = async (documentId: string) => {
    setMessage('');
    try {
      const response = await fetch(`/api/employees/${employee.id}/asset-url?type=document&documentId=${encodeURIComponent(documentId)}`, { headers: getAuthHeaders() });
      const result = throwIfError<any>(await response.json());
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not open document.'); }
  };

  const remove = async (documentId: string) => {
    if (!window.confirm('Delete this employee document?')) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/employees/${employee.id}/documents?documentId=${encodeURIComponent(documentId)}`, { method: 'DELETE', headers: getAuthHeaders() });
      throwIfError(await response.json());
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(employee.id) });
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete document.'); }
    finally { setBusy(false); }
  };

  return <section className="no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-[#0B3C6D]">Photo and Documents</h2><p className="mt-1 text-sm text-gray-500">Private employee files · PDF, JPG, or PNG · 10 MB maximum</p></div>{busy && <LoaderCircle className="h-5 w-5 animate-spin text-[#0B3C6D]"/>}</div>
    {message && <p role="status" className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div><div className="mb-3 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-gray-100">{photoUrl ? <img src={photoUrl} alt={`${employee.full_name} profile`} className="h-full w-full object-cover"/> : <ImagePlus className="h-10 w-10 text-gray-300"/>}</div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Upload className="h-4 w-4"/> {employee.photo ? 'Replace photo' : 'Upload photo'}<input className="sr-only" type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, 'photo'); event.target.value = ''; }}/></label></div>
      <div><div className="mb-3 flex flex-col gap-2 sm:flex-row"><select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}><option>Employment document</option><option>Identity document</option><option>Academic certificate</option><option>CV / Résumé</option><option>Pension document</option><option>Other</option></select><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0B3C6D] px-3 py-2 text-sm font-semibold text-white hover:bg-[#082e54]"><Upload className="h-4 w-4"/> Upload document<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, 'document'); event.target.value = ''; }}/></label></div>
        {employee.documents?.length ? <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">{employee.documents.map((document) => <li key={document.id} className="flex items-center justify-between gap-3 p-3"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-[#0B3C6D]"/><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{document.file_name}</p><p className="text-xs text-gray-500">{document.category} · {(document.bytes / 1024 / 1024).toFixed(2)} MB · {new Date(document.created_at).toLocaleDateString()}</p></div></div><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Download ${document.file_name}`} onClick={() => void download(document.id)} className="rounded p-2 text-[#0B3C6D] hover:bg-blue-50"><Download className="h-4 w-4"/></button><button type="button" aria-label={`Delete ${document.file_name}`} disabled={busy} onClick={() => void remove(document.id)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></div></li>)}</ul> : <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">No documents uploaded yet.</p>}</div>
    </div>
  </section>;
}
