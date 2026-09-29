'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCreateEmployee, useProfile } from '@/hooks/api';
import EmployeeForm from '@/components/dashboard/employees/EmployeeForm';

export default function NewEmployeePage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const createEmployee = useCreateEmployee();
  const [error, setError] = useState('');
  useEffect(() => { if (profile && profile.role !== 'hr') router.replace('/dashboard'); }, [profile, router]);
  if (!profile || profile.role !== 'hr') return null;

  const submit = async (form: Record<string, any>) => {
    setError('');
    try {
      const employee = await createEmployee.mutateAsync(form);
      router.replace(`/dashboard/employees/${employee.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create employee'); }
  };
  return <div className="mx-auto max-w-5xl space-y-5">
    <Link href="/dashboard/employees" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3C6D]"><ArrowLeft className="h-4 w-4"/> Back to Employees</Link>
    <div><h1 className="text-2xl font-bold text-gray-900">Add Employee</h1><p className="mt-1 text-sm text-gray-500">An available ID from a fired employee will be reused first; otherwise, a new employee ID will be assigned after saving.</p></div>
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">{error && <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<EmployeeForm onSubmit={submit} saving={createEmployee.isPending}/></div>
  </div>;
}
