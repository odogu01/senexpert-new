// @ts-nocheck
/** Server-only employee data, compensation encryption, and Cloudinary integration. */
import type { Employee, EmployeeAllowance, EmployeePayrollBank, EmployeePension } from '@/lib/database.types';
import { EmployeeRepository } from './repositories/EmployeeRepository';

const employeeRepo = new EmployeeRepository();
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function cleanText(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalizeEmployee(input: Record<string, any>) {
  const textFields = ['full_name', 'category', 'department', 'job_title', 'official_email', 'personal_email', 'gender', 'marital_status', 'contact_number', 'contact_address', 'next_of_kin_name', 'next_of_kin_relationship', 'next_of_kin_contact', 'supervisor_manager'];
  const normalized: Record<string, any> = {};
  for (const field of textFields) normalized[field] = cleanText(input[field], field.includes('address') ? 1000 : 200);
  if (!['Contract', 'Staff', 'Intern', 'Copper'].includes(normalized.category)) normalized.category = '';
  normalized.official_email = normalized.official_email.toLowerCase();
  normalized.employment_status = ['active', 'on_leave', 'terminated'].includes(input.employment_status) ? input.employment_status : 'active';
  normalized.number_of_children = Math.max(0, Math.min(30, Number(input.number_of_children) || 0));
  normalized.annual_leave_days = Math.max(0, Math.min(365, Number(input.annual_leave_days) || 0));
  for (const field of ['resumption_date', 'date_of_birth']) {
    if (input[field]) {
      const date = new Date(input[field]);
      if (!Number.isNaN(date.getTime())) normalized[field] = date;
    }
  }
  normalized.allowances = Array.isArray(input.allowances)
    ? input.allowances.slice(0, 20).map((item: EmployeeAllowance) => ({ name: cleanText(item.name, 80), amount: Math.max(0, Number(item.amount) || 0) })).filter((item: EmployeeAllowance) => item.name)
    : [];
  normalized.pension = input.pension && typeof input.pension === 'object' ? {
    provider: cleanText(input.pension.provider, 120), scheme: cleanText(input.pension.scheme, 120), pin: cleanText(input.pension.pin, 80),
  } : {};
  normalized.basic_salary = Math.max(0, Number(input.basic_salary) || 0);
  normalized.salary_frequency = 'monthly';
  normalized.christmas_bonus = Math.max(0, Number(input.christmas_bonus) || 0);
  normalized.leave_allowance = Math.max(0, Number(input.leave_allowance) || 0);
  normalized.payroll_bank = input.payroll_bank && typeof input.payroll_bank === 'object' ? {
    bank_name: cleanText(input.payroll_bank.bank_name, 120),
    account_name: cleanText(input.payroll_bank.account_name, 120),
    account_number: cleanText(input.payroll_bank.account_number, 40).replace(/\s/g, ''),
  } as EmployeePayrollBank : {};
  return normalized;
}

async function encryptCompensation(data: Record<string, any>) {
  const encodedKey = process.env.EMPLOYEE_PII_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error('Employee compensation encryption is not configured');
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('EMPLOYEE_PII_ENCRYPTION_KEY must be a base64 encoded 32-byte key');
  const crypto = await import('node:crypto');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ basic_salary: data.basic_salary, salary_frequency: data.salary_frequency, christmas_bonus: data.christmas_bonus, leave_allowance: data.leave_allowance, allowances: data.allowances, payroll_bank: data.payroll_bank, pension: data.pension }), 'utf8'), cipher.final()]);
  return { compensation_ciphertext: ciphertext.toString('base64'), compensation_iv: iv.toString('base64'), compensation_tag: cipher.getAuthTag().toString('base64') };
}

async function decryptCompensation(record: Record<string, any>) {
  if (!record.compensation_ciphertext) return {};
  const encodedKey = process.env.EMPLOYEE_PII_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error('Employee compensation encryption is not configured');
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('EMPLOYEE_PII_ENCRYPTION_KEY must be a base64 encoded 32-byte key');
  const crypto = await import('node:crypto');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(record.compensation_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(record.compensation_tag, 'base64'));
  const clear = Buffer.concat([decipher.update(Buffer.from(record.compensation_ciphertext, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(clear);
}

function publicEmployee(record: Record<string, any>, compensation: Record<string, any> = {}) {
  const { compensation_ciphertext, compensation_iv, compensation_tag, ...employee } = record;
  return { ...employee, ...compensation };
}

export async function listEmployees(filters: Record<string, any>) {
  await employeeRepo.ensureIndexes();
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 25));
  const result = await employeeRepo.list({ ...filters, page, pageSize });
  return { success: true, data: { ...result, page, pageSize } };
}

export async function getEmployeeStats() {
  await employeeRepo.ensureIndexes();
  return { success: true, data: await employeeRepo.stats() };
}

export async function getEmployee(id: string) {
  const record = await employeeRepo.findById(id);
  if (!record) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const compensation = await decryptCompensation(record);
  return { success: true, data: publicEmployee(record, compensation) };
}

export async function createEmployee(input: Record<string, any>) {
  const normalized = normalizeEmployee(input);
  if (!normalized.full_name || !normalized.category || !normalized.department || !normalized.job_title || !normalized.official_email) {
    return { success: false, error: { message: 'Full name, category, department, job title, and official email are required' }, status: 400 };
  }
  await employeeRepo.ensureIndexes();
  const compensation = await encryptCompensation(normalized);
  const { basic_salary, salary_frequency, christmas_bonus, leave_allowance, allowances, payroll_bank, pension, ...employeeFields } = normalized;
  try {
    const record = await employeeRepo.create({ ...employeeFields, ...compensation, documents: [] });
    return { success: true, data: publicEmployee(record, { basic_salary, salary_frequency, christmas_bonus, leave_allowance, allowances, payroll_bank, pension }) };
  } catch (error: any) {
    if (error?.code === 11000) return { success: false, error: { message: 'An employee with that official email already exists' }, status: 409 };
    throw error;
  }
}

export async function updateEmployee(id: string, input: Record<string, any>) {
  const current = await employeeRepo.findById(id);
  if (!current) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const normalized = normalizeEmployee({ ...current, ...input });
  if (!normalized.full_name || !normalized.category || !normalized.department || !normalized.job_title || !normalized.official_email) {
    return { success: false, error: { message: 'Required employee details are missing' }, status: 400 };
  }
  const compensation = await encryptCompensation(normalized);
  const { basic_salary, salary_frequency, christmas_bonus, leave_allowance, allowances, payroll_bank, pension, ...employeeFields } = normalized;
  const updated = await employeeRepo.update(id, { ...employeeFields, ...compensation });
  return { success: true, data: publicEmployee(updated, { basic_salary, salary_frequency, christmas_bonus, leave_allowance, allowances, payroll_bank, pension }) };
}

async function cloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary environment variables are not configured');
  const { v2 } = await import('cloudinary');
  v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { sdk: v2, cloudName, apiKey, apiSecret };
}

export async function getCloudinaryUploadSignature(employeeMongoId: string, kind: 'photo' | 'document') {
  const employee = await employeeRepo.findById(employeeMongoId);
  if (!employee) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const { sdk, cloudName, apiKey } = await cloudinary();
  const crypto = await import('node:crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = kind === 'photo' ? 'photos' : 'documents';
  const public_id = `employees/${folder}/${employee.employee_id}/${crypto.randomUUID()}`;
  const allowed_formats = kind === 'photo' ? 'jpg,png' : 'pdf,jpg,png';
  const params = { public_id, timestamp, type: 'authenticated', allowed_formats };
  return { success: true, data: { cloud_name: cloudName, api_key: apiKey, resource_type: 'image', signature: sdk.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET), ...params } };
}

export async function saveUploadedEmployeeAsset(employeeMongoId: string, actorId: string, input: Record<string, any>) {
  const employee = await employeeRepo.findById(employeeMongoId);
  if (!employee) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const kind = input.kind === 'photo' ? 'photo' : 'document';
  const publicId = cleanText(input.public_id, 300);
  const folder = kind === 'photo' ? 'photos' : 'documents';
  if (!publicId.startsWith(`employees/${folder}/${employee.employee_id}/`) || input.resource_type !== 'image') {
    return { success: false, error: { message: 'Uploaded asset does not belong to this employee' }, status: 400 };
  }
  const format = cleanText(input.format, 12).toLowerCase();
  const allowed = kind === 'photo' ? ['jpg', 'jpeg', 'png'] : ['pdf', 'jpg', 'jpeg', 'png'];
  const { sdk, apiSecret } = await cloudinary();
  const expectedSignature = sdk.utils.api_sign_request({ public_id: publicId, version: Number(input.version) }, apiSecret);
  if (!input.signature || expectedSignature !== input.signature) {
    return { success: false, error: { message: 'Cloudinary upload response could not be verified' }, status: 400 };
  }
  if (!allowed.includes(format) || Number(input.bytes) > MAX_UPLOAD_BYTES || Number(input.bytes) <= 0) {
    if (Number(input.bytes) > MAX_UPLOAD_BYTES) await sdk.uploader.destroy(publicId, { resource_type: 'image', type: 'authenticated', invalidate: true });
    return { success: false, error: { message: 'File type or size is not allowed' }, status: 400 };
  }
  if (kind === 'photo') {
    const previousPhoto = employee.photo;
    await employeeRepo.update(employeeMongoId, { photo: { public_id: publicId, resource_type: 'image', format } });
    if (previousPhoto?.public_id && previousPhoto.public_id !== publicId) {
      try { await sdk.uploader.destroy(previousPhoto.public_id, { resource_type: previousPhoto.resource_type, type: 'authenticated', invalidate: true }); }
      catch (error) { console.error('Could not remove replaced employee photo from Cloudinary:', error); }
    }
    return { success: true, data: { photo: true } };
  }
  const document = {
    id: (await import('node:crypto')).randomUUID(),
    category: cleanText(input.category, 80) || 'Other',
    file_name: cleanText(input.original_filename, 200) || `Employee document.${format}`,
    format, bytes: Number(input.bytes), public_id: publicId, resource_type: 'image', uploaded_by: actorId, created_at: new Date(),
  };
  await employeeRepo.addDocument(employeeMongoId, document);
  return { success: true, data: document };
}

export async function getEmployeeAssetUrl(employeeMongoId: string, assetType: 'photo' | 'document', documentId?: string) {
  const employee = await employeeRepo.findById(employeeMongoId);
  if (!employee) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const asset = assetType === 'photo' ? employee.photo : employee.documents?.find((item: any) => item.id === documentId);
  if (!asset) return { success: false, error: { message: 'File not found' }, status: 404 };
  const { sdk } = await cloudinary();
  const expires_at = Math.floor(Date.now() / 1000) + 60;
  const url = sdk.utils.private_download_url(asset.public_id, asset.format, { resource_type: asset.resource_type, type: 'authenticated', expires_at, attachment: assetType === 'document' });
  return { success: true, data: { url } };
}

export async function deleteEmployeeDocument(employeeMongoId: string, documentId: string) {
  const employee = await employeeRepo.findById(employeeMongoId);
  if (!employee) return { success: false, error: { message: 'Employee not found' }, status: 404 };
  const document = employee.documents?.find((item: any) => item.id === documentId);
  if (!document) return { success: false, error: { message: 'Document not found' }, status: 404 };
  const { sdk } = await cloudinary();
  await sdk.uploader.destroy(document.public_id, { resource_type: document.resource_type, type: 'authenticated', invalidate: true });
  await employeeRepo.removeDocument(employeeMongoId, documentId);
  return { success: true, data: { deleted: true } };
}
