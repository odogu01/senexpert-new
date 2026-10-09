'use client';

import { useEffect, useState } from 'react';
import type { Employee } from '@/lib/database.types';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/10';
const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

function toDateInput(value?: string | Date) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function calculateAge(value?: string | Date) {
  if (!value) return '';
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

export default function EmployeeForm({ employee, onSubmit, onCancel, saving = false }: {
  employee?: Employee | null;
  onSubmit: (value: Record<string, any>) => void;
  onCancel?: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => {
    const legacyAnnual = employee?.salary_frequency === 'annual';
    setForm({
      full_name: employee?.full_name || '', category: employee?.category || '', department: employee?.department || '',
      job_title: employee?.job_title || '', official_email: employee?.official_email || '', personal_email: employee?.personal_email || '',
      resumption_date: toDateInput(employee?.resumption_date), date_of_birth: toDateInput(employee?.date_of_birth),
      gender: employee?.gender || '', marital_status: employee?.marital_status || '', number_of_children: employee?.number_of_children ?? 0,
      contact_number: employee?.contact_number || '', contact_address: employee?.contact_address || '',
      next_of_kin_name: employee?.next_of_kin_name || '', next_of_kin_relationship: employee?.next_of_kin_relationship || '',
      next_of_kin_contact: employee?.next_of_kin_contact || '', supervisor_manager: employee?.supervisor_manager || '',
      employment_status: employee?.employment_status || 'active',
      salary_frequency: 'monthly',
      christmas_bonus: employee?.christmas_bonus ?? '',
      leave_allowance: employee?.leave_allowance ?? '',
      basic_salary: legacyAnnual ? Number(employee?.basic_salary || 0) / 12 : employee?.basic_salary ?? '',
      allowances: employee?.allowances?.length ? employee.allowances.map((item) => ({ ...item, amount: legacyAnnual ? item.amount / 12 : item.amount })) : [], payroll_bank: employee?.payroll_bank || { bank_name: '', account_name: '', account_number: '' },
      annual_leave_days: employee?.annual_leave_days ?? 0, pension: employee?.pension || { provider: '', scheme: '', pin: '' },
    });
  }, [employee]);

  const setField = (field: string, value: any) => setForm((previous) => ({ ...previous, [field]: value }));
  const setNested = (key: string, field: string, value: any) => setForm((previous) => ({ ...previous, [key]: { ...previous[key], [field]: value } }));
  const textField = (name: string, label: string, options: { type?: string; required?: boolean } = {}) => (
    <label className="block" key={name}><span className={labelClass}>{label}{options.required && ' *'}</span><input className={inputClass} type={options.type || 'text'} value={form[name] ?? ''} onChange={(event) => setField(name, event.target.value)} required={options.required} /></label>
  );
  const selectField = (name: string, label: string, values: string[]) => (
    <label className="block" key={name}><span className={labelClass}>{label}</span><select className={inputClass} value={form[name] ?? ''} onChange={(event) => setField(name, event.target.value)}><option value="">Select…</option>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
  );

  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }} className="space-y-7">
    <section><h2 className="mb-4 border-b pb-2 text-lg font-semibold text-[#0B3C6D]">Employment</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {textField('full_name', 'Full Name', { required: true })}<label className="block"><span className={labelClass}>Category *</span><select className={inputClass} value={form.category || ''} onChange={(event) => setField('category', event.target.value)} required><option value="">Select category…</option>{['Contract', 'Staff', 'Intern', 'Copper', 'MD/CEO', 'C.O.O'].map((category) => <option key={category} value={category}>{category}</option>)}</select><span className="mt-1 block text-xs text-gray-500">One current MD/CEO and up to two current C.O.O employees can be assigned.</span></label>{textField('department', 'Department', { required: true })}{textField('job_title', 'Job Title', { required: true })}{textField('official_email', 'Official Email', { type: 'email', required: true })}{textField('personal_email', 'Personal Email', { type: 'email' })}{textField('resumption_date', 'Resumption Date', { type: 'date' })}
      <label className="block"><span className={labelClass}>Employment Status</span><select className={inputClass} value={form.employment_status || 'active'} onChange={(event) => setField('employment_status', event.target.value)} disabled={['terminated', 'fired', 'resigned'].includes(form.employment_status)}><option value="active">Active</option><option value="on_leave">On Leave</option>{form.employment_status === 'terminated' && <option value="terminated">Contract terminated</option>}{form.employment_status === 'fired' && <option value="fired">Fired</option>}{form.employment_status === 'resigned' && <option value="resigned">Resigned / Exited</option>}</select></label>
      {textField('supervisor_manager', 'Supervisor / Manager')}
    </div></section>

    <section><h2 className="mb-4 border-b pb-2 text-lg font-semibold text-[#0B3C6D]">Personal Details</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {textField('date_of_birth', 'Date of Birth', { type: 'date' })}<label className="block"><span className={labelClass}>Age</span><input className={`${inputClass} bg-gray-50`} readOnly value={calculateAge(form.date_of_birth)} placeholder="Calculated from DOB" /></label>
      {selectField('gender', 'Gender', ['Female', 'Male', 'Other', 'Prefer not to say'])}{selectField('marital_status', 'Marital Status', ['Single', 'Married', 'Divorced', 'Widowed'])}
      <label className="block"><span className={labelClass}>Number of Children</span><input className={inputClass} type="number" min="0" value={form.number_of_children ?? 0} onChange={(event) => setField('number_of_children', event.target.value)} /></label>
      {textField('contact_number', 'Contact Number')}<label className="block sm:col-span-2 lg:col-span-3"><span className={labelClass}>Contact Address</span><textarea className={inputClass} rows={2} value={form.contact_address || ''} onChange={(event) => setField('contact_address', event.target.value)} /></label>
    </div></section>

    <section><h2 className="mb-4 border-b pb-2 text-lg font-semibold text-[#0B3C6D]">Next of Kin</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {textField('next_of_kin_name', 'Full Name')}{textField('next_of_kin_relationship', 'Relationship')}{textField('next_of_kin_contact', 'Contact Number')}
    </div></section>

    <section><h2 className="mb-4 border-b pb-2 text-lg font-semibold text-[#0B3C6D]">Compensation and Benefits</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block"><span className={labelClass}>Basic Salary (monthly, ₦)</span><input className={inputClass} type="number" min="0" step="0.01" value={form.basic_salary ?? ''} onChange={(event) => setField('basic_salary', event.target.value)} /></label>
      <label className="block"><span className={labelClass}>Christmas Bonus (yearly, ₦)</span><input className={inputClass} type="number" min="0" step="0.01" value={form.christmas_bonus ?? ''} onChange={(event) => setField('christmas_bonus', event.target.value)} /></label>
      <label className="block"><span className={labelClass}>Leave Allowance (per annum, ₦)</span><input className={inputClass} type="number" min="0" step="0.01" value={form.leave_allowance ?? ''} onChange={(event) => setField('leave_allowance', event.target.value)} /></label>
      <label className="block"><span className={labelClass}>Annual Leave Entitlement (days)</span><input className={inputClass} type="number" min="0" max="365" value={form.annual_leave_days ?? 0} onChange={(event) => setField('annual_leave_days', event.target.value)} /></label>
    </div>
      <div className="mt-4 rounded-lg border border-gray-200 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-medium">Allowances (monthly)</h3><button type="button" className="text-sm font-medium text-[#0B3C6D]" onClick={() => setField('allowances', [...(form.allowances || []), { name: '', amount: '' }])}>+ Add allowance</button></div>
        {(form.allowances || []).map((item: any, index: number) => <div key={index} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2"><input className={inputClass} placeholder="e.g. Housing" value={item.name} onChange={(event) => setField('allowances', form.allowances.map((a: any, i: number) => i === index ? { ...a, name: event.target.value } : a))} /><input className={inputClass} type="number" min="0" step="0.01" placeholder="Monthly amount (₦)" value={item.amount} onChange={(event) => setField('allowances', form.allowances.map((a: any, i: number) => i === index ? { ...a, amount: event.target.value } : a))} /><button type="button" className="px-2 text-red-600" onClick={() => setField('allowances', form.allowances.filter((_: any, i: number) => i !== index))}>Remove</button></div>)}
        {!form.allowances?.length && <p className="text-sm text-gray-500">No allowances added.</p>}
      </div>
      {(() => { const monthlyGross = (Number(form.basic_salary) || 0) + (form.allowances || []).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0); const yearlyGross = monthlyGross * 12 + (Number(form.christmas_bonus) || 0) + (Number(form.leave_allowance) || 0); const money = (amount: number) => `₦${new Intl.NumberFormat('en-NG').format(amount)}`; return <div className="mt-4 grid gap-3 rounded-lg bg-blue-50 p-4 sm:grid-cols-2"><div><p className="text-sm text-gray-600">Monthly Gross Pay</p><p className="mt-1 text-lg font-semibold text-[#0B3C6D]">{money(monthlyGross)}</p><p className="text-xs text-gray-500">Basic salary + monthly allowances</p></div><div><p className="text-sm text-gray-600">Yearly Gross Pay</p><p className="mt-1 text-lg font-semibold text-[#0B3C6D]">{money(yearlyGross)}</p><p className="text-xs text-gray-500">12 × monthly gross + yearly Christmas bonus + leave allowance</p></div></div>; })()}
      <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3"><h3 className="font-medium sm:col-span-2 lg:col-span-3">Payroll Bank Details</h3>
        {(['bank_name', 'account_name', 'account_number'] as const).map((field) => <label key={field} className="block"><span className={labelClass}>{field === 'bank_name' ? 'Bank Name' : field === 'account_name' ? 'Account Name' : 'Account Number'}</span><input className={inputClass} value={form.payroll_bank?.[field] || ''} onChange={(event) => setNested('payroll_bank', field, event.target.value)} /></label>)}
      </div>
      <div className="mt-4 grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3"><h3 className="font-medium sm:col-span-2 lg:col-span-3">Pension Scheme (Optional)</h3>
        {(['provider', 'scheme', 'pin'] as const).map((field) => <label key={field} className="block"><span className={labelClass}>{field === 'pin' ? 'Pension / RSA PIN' : field[0].toUpperCase() + field.slice(1)}</span><input className={inputClass} value={form.pension?.[field] || ''} onChange={(event) => setNested('pension', field, event.target.value)} /></label>)}
      </div>
    </section>
    <div className="flex justify-end gap-3 border-t pt-5">{onCancel && <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>}<button disabled={saving} className="rounded-lg bg-[#0B3C6D] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : employee ? 'Save Changes' : 'Create Employee'}</button></div>
  </form>;
}
