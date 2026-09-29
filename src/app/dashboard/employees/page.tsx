'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useEmployees, useProfile } from '@/hooks/api';

export default function EmployeesPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useEmployees({ search, department, category, status, page, pageSize: 20 });

  useEffect(() => { if (profile && profile.role !== 'hr') router.replace('/dashboard'); }, [profile, router]);
  if (!profile || profile.role !== 'hr') return null;

  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / 20));
  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-gray-900">Employees</h1><p className="mt-1 text-sm text-gray-500">Employee directory and records</p></div><Link href="/dashboard/employees/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B3C6D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#082e54]"><UserPlus className="h-4 w-4"/> Add Employee</Link></div>
    <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-4">
      <label className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><input className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" placeholder="Search name, ID, department, job title, email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}/></label>
      <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Filter department" value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }}/>
      <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}/><select className="rounded-lg border border-gray-300 px-2 py-2 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All status</option><option value="active">Active</option><option value="on_leave">On Leave</option><option value="terminated">Contract terminated</option><option value="fired">Fired</option></select></div>
    </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {isLoading ? <div className="p-12 text-center text-sm text-gray-500">Loading employees…</div> : isError ? <div className="p-12 text-center text-sm text-red-600">Could not load employee records.</div> : items.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto mb-3 h-9 w-9 text-gray-300"/><p className="font-medium text-gray-700">No employees found</p><p className="mt-1 text-sm text-gray-500">Add an employee or adjust the search filters.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Employee ID</th><th className="px-5 py-3">Full Name</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Job Title</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{items.map((employee) => <tr key={employee.id} tabIndex={0} role="link" onClick={() => router.push(`/dashboard/employees/${employee.id}`)} onKeyDown={(event) => { if (event.key === 'Enter') router.push(`/dashboard/employees/${employee.id}`); }} className="cursor-pointer hover:bg-blue-50/50"><td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold text-[#0B3C6D]">{employee.former_employee_id || employee.employee_id}</td><td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">{employee.full_name}</td><td className="px-5 py-4 text-sm text-gray-600">{employee.category}</td><td className="px-5 py-4 text-sm text-gray-600">{employee.department}</td><td className="px-5 py-4 text-sm text-gray-600">{employee.job_title}</td><td className="px-5 py-4 text-sm text-gray-600">{employee.official_email}</td><td className="whitespace-nowrap px-5 py-4 text-sm capitalize text-gray-600">{employee.employment_status === 'terminated' ? 'Contract terminated' : employee.employment_status.replace('_', ' ')}</td></tr>)}</tbody></table></div>}
      {!!data && data.total > 0 && <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500"><span>{data.total} employee{data.total === 1 ? '' : 's'} · Page {page} of {totalPages}</span><div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><button aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></div>}
    </div>
  </div>;
}
