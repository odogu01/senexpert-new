'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Pencil, X, UserRound, UserX, FileX } from 'lucide-react';
import { useEmployee, useProfile, useUpdateEmployee, useEndEmployeeEngagement } from '@/hooks/api';
import type { Employee } from '@/lib/database.types';
import EmployeeForm, { calculateAge } from '@/components/dashboard/employees/EmployeeForm';
import EmployeeFiles from '@/components/dashboard/employees/EmployeeFiles';

function valueText(value: unknown) { return value === undefined || value === null || value === '' ? '—' : String(value); }
function dateText(value?: string | Date) { return value ? new Date(value).toLocaleDateString() : '—'; }
function Detail({ label, value }: { label: string; value: unknown }) { return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-900">{valueText(value)}</dd></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:break-inside-avoid"><h2 className="mb-4 border-b border-gray-100 pb-3 text-lg font-semibold text-[#0B3C6D]">{title}</h2><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl></section>; }

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id || '');
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: employee, isLoading, isError, error } = useEmployee(id);
  const updateEmployee = useUpdateEmployee(id);
  const endEngagement = useEndEmployeeEngagement(id);
  const [editing, setEditing] = useState(false);
  const [revealedAccount, setRevealedAccount] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => { if (profile && profile.role !== 'hr') router.replace('/dashboard'); }, [profile, router]);
  if (!profile || profile.role !== 'hr') return null;
  if (isLoading) return <p className="p-8 text-center text-sm text-gray-500">Loading employee profile…</p>;
  if (isError || !employee) return <div className="rounded-xl bg-white p-8 text-center"><p className="text-red-700">{error instanceof Error ? error.message : 'Employee record could not be loaded.'}</p><Link href="/dashboard/employees" className="mt-4 inline-block text-sm text-[#0B3C6D]">Return to employee directory</Link></div>;

  const save = async (form: Record<string, any>) => {
    setSaveError('');
    try { await updateEmployee.mutateAsync(form); setEditing(false); }
    catch (reason) { setSaveError(reason instanceof Error ? reason.message : 'Could not save changes.'); }
  };
  const endEmployment = async (action: 'terminate_contract' | 'fire_staff') => {
    const message = action === 'fire_staff'
      ? `Fire ${employee.full_name}? Their employee ID ${employee.employee_id} will become available for a new employee.`
      : `Terminate the contract for ${employee.full_name}?`;
    if (!window.confirm(message)) return;
    setActionError('');
    try { await endEngagement.mutateAsync(action); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not update employment status.'); }
  };
  const legacyAnnual = employee.salary_frequency === 'annual';
  const monthlyBasic = legacyAnnual ? (employee.basic_salary || 0) / 12 : (employee.basic_salary || 0);
  const monthlyAllowances = (employee.allowances || []).reduce((sum, item) => sum + (legacyAnnual ? item.amount / 12 : item.amount), 0);
  const monthlyGross = monthlyBasic + monthlyAllowances;
  const yearlyGross = monthlyGross * 12 + (employee.christmas_bonus || 0) + (employee.leave_allowance || 0);
  const money = (amount: number) => `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(amount)}`;

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="no-print flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard/employees" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B3C6D]"><ArrowLeft className="h-4 w-4"/> Employees</Link><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium"><Printer className="h-4 w-4"/> Print Details</button>{['active', 'on_leave'].includes(employee.employment_status) && employee.category === 'Contract' && <button type="button" disabled={endEngagement.isPending} onClick={() => endEmployment('terminate_contract')} className="inline-flex items-center gap-2 rounded-lg border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-800 disabled:opacity-50"><FileX className="h-4 w-4"/> Terminate Contract</button>}{['active', 'on_leave'].includes(employee.employment_status) && employee.category === 'Staff' && <button type="button" disabled={endEngagement.isPending} onClick={() => endEmployment('fire_staff')} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><UserX className="h-4 w-4"/> Fire Staff</button>}{!editing ? <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#0B3C6D] px-3 py-2 text-sm font-semibold text-white"><Pencil className="h-4 w-4"/> Edit Employee</button> : <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"><X className="h-4 w-4"/> Cancel Edit</button>}</div></div>
    {actionError && <p role="alert" className="no-print rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    <header className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-[#0B3C6D] to-[#12659c] p-6 text-white sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15">{employee.photo ? <Photo employee={employee}/> : <UserRound className="h-9 w-9 text-white/70"/>}</div><div className="min-w-0"><p className="font-mono text-sm text-blue-100">{employee.former_employee_id || employee.employee_id}</p><h1 className="mt-1 text-2xl font-bold">{employee.full_name}</h1><p className="mt-1 text-blue-100">{employee.job_title} · {employee.department}</p></div><div className="sm:ml-auto"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize">{employee.employment_status === 'terminated' ? 'Contract terminated' : employee.employment_status.replace('_', ' ')}</span></div>
    </header>
    {editing ? <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="mb-5 text-xl font-semibold text-gray-900">Edit Employee Details</h2>{saveError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}<EmployeeForm employee={employee} onSubmit={save} onCancel={() => setEditing(false)} saving={updateEmployee.isPending}/></section> : <>
      <Section title="Employment Details"><Detail label={employee.employment_status === 'fired' ? 'Former Employee ID' : 'Employee ID'} value={employee.employment_status === 'fired' ? employee.former_employee_id : employee.employee_id}/><Detail label="Category" value={employee.category}/><Detail label="Department" value={employee.department}/><Detail label="Job Title" value={employee.job_title}/><Detail label="Official Email" value={employee.official_email}/><Detail label="Personal Email" value={employee.personal_email}/><Detail label="Resumption Date" value={dateText(employee.resumption_date)}/><Detail label="Supervisor / Manager" value={employee.supervisor_manager}/><Detail label="Employment Status" value={employee.employment_status === 'terminated' ? 'Contract terminated' : employee.employment_status.replace('_', ' ')}/>{employee.employment_end_date && <Detail label="Last Employment Date" value={dateText(employee.employment_end_date)}/>}</Section>
      <Section title="Personal Information"><Detail label="Date of Birth" value={dateText(employee.date_of_birth)}/><Detail label="Age" value={calculateAge(employee.date_of_birth)}/><Detail label="Gender" value={employee.gender}/><Detail label="Marital Status" value={employee.marital_status}/><Detail label="Number of Children" value={employee.number_of_children}/><Detail label="Contact Number" value={employee.contact_number}/><Detail label="Contact Address" value={employee.contact_address}/></Section>
      <Section title="Next of Kin"><Detail label="Name" value={employee.next_of_kin_name}/><Detail label="Relationship" value={employee.next_of_kin_relationship}/><Detail label="Contact Number" value={employee.next_of_kin_contact}/></Section>
      <Section title="Compensation and Benefits"><Detail label="Monthly Basic Salary" value={money(monthlyBasic)}/><Detail label="Yearly Christmas Bonus" value={money(employee.christmas_bonus || 0)}/><Detail label="Yearly Leave Allowance" value={money(employee.leave_allowance || 0)}/><Detail label="Monthly Gross Pay" value={money(monthlyGross)}/><Detail label="Yearly Gross Pay" value={money(yearlyGross)}/><Detail label="Annual Leave Entitlement" value={employee.annual_leave_days === undefined ? '—' : `${employee.annual_leave_days} days`}/><Detail label="Pension Provider" value={employee.pension?.provider}/><Detail label="Pension Scheme" value={employee.pension?.scheme}/><Detail label="Pension / RSA PIN" value={employee.pension?.pin}/><div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Monthly Allowances</dt>{employee.allowances?.length ? <dd className="mt-2 flex flex-wrap gap-2">{employee.allowances.map((item, index) => <span key={`${item.name}-${index}`} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-900">{item.name}: {money(legacyAnnual ? item.amount / 12 : item.amount)}</span>)}</dd> : <dd className="mt-1 text-sm font-medium text-gray-900">—</dd>}</div><div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Payroll Bank Details</dt><dd className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-900"><span>{valueText(employee.payroll_bank?.bank_name)}</span><span>{valueText(employee.payroll_bank?.account_name)}</span><span>{employee.payroll_bank?.account_number ? revealedAccount ? employee.payroll_bank.account_number : `••••••${employee.payroll_bank.account_number.slice(-4)}` : '—'}</span>{employee.payroll_bank?.account_number && <button type="button" className="no-print text-xs text-[#0B3C6D] underline" onClick={() => setRevealedAccount((value) => !value)}>{revealedAccount ? 'Hide account number' : 'Reveal account number'}</button>}</dd></div></Section>
    </>}
    <EmployeeFiles employee={employee as Employee}/>
    <p className="text-right text-xs text-gray-400">Created {dateText(employee.created_at)} · Last updated {dateText(employee.updated_at)}</p>
  </div>;
}

function Photo({ employee }: { employee: Employee }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/employees/${employee.id}/asset-url?type=photo`, { headers: { Authorization: `Bearer ${localStorage.getItem('senexpert_token') || ''}` } })
      .then((response) => response.json()).then((result) => { if (active && result.success) setSrc(result.data.url); }).catch(() => {});
    return () => { active = false; };
  }, [employee.id, employee.photo?.public_id]);
  return src ? <img src={src} alt="Employee profile" className="h-full w-full object-cover"/> : <UserRound className="h-9 w-9 text-white/70"/>;
}
