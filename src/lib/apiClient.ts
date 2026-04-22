/**
 * Client-side API wrapper
 * All API calls go through these functions to avoid importing server-side modules
 */

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('senexpert_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API
export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function logoutApi() {
  localStorage.removeItem('senexpert_token');
  localStorage.removeItem('senexpert_user');
  localStorage.removeItem('senexpert_profile');
  return { success: true };
}

// Profile API
export async function getProfileApi() {
  const res = await fetch(`${API_BASE}/profile`, { headers: getHeaders() });
  return res.json();
}

export async function updateProfileApi(data: { full_name?: string; role?: string; avatar_url?: string }) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

// Users API
export async function getUsersApi() {
  const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
  return res.json();
}

export async function createUserApi(data: { email: string; password: string; full_name: string; role: string }) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUserApi(id: string) {
  const res = await fetch(`${API_BASE}/users?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function resetUserPasswordApi(id: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/users?id=${encodeURIComponent(id)}&action=reset-password`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  return res.json();
}

// Tools API
export async function getToolsApi(filters?: { category?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  
  const res = await fetch(`${API_BASE}/tools?${params}`, { headers: getHeaders() });
  return res.json();
}

export async function getToolByIdApi(id: string) {
  const res = await fetch(`${API_BASE}/tools?id=${encodeURIComponent(id)}`, { headers: getHeaders() });
  return res.json();
}

export async function createToolApi(data: unknown) {
  const res = await fetch(`${API_BASE}/tools`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateToolApi(id: string, data: unknown) {
  const res = await fetch(`${API_BASE}/tools?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteToolApi(id: string) {
  const res = await fetch(`${API_BASE}/tools?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function getCategoriesApi() {
  const res = await fetch(`${API_BASE}/tools/categories`, { headers: getHeaders() });
  return res.json();
}

// Dashboard Stats API
export async function getDashboardStatsApi() {
  const res = await fetch(`${API_BASE}/tools/stats`, { headers: getHeaders() });
  return res.json();
}

// Alerts API
export async function getAlertsApi(unreadOnly = false) {
  const res = await fetch(`${API_BASE}/alerts?unreadOnly=${unreadOnly}`, { headers: getHeaders() });
  return res.json();
}

export async function markAlertAsReadApi(id: string) {
  const res = await fetch(`${API_BASE}/alerts?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ is_read: true }),
  });
  return res.json();
}

// Activity/Audit Logs API
export async function getAuditLogsApi(limit = 10) {
  const res = await fetch(`${API_BASE}/audit-logs?limit=${limit}`, { headers: getHeaders() });
  return res.json();
}

// Tool Requests API
export async function getToolRequestsApi(filters?: { status?: string; movement_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.movement_type) params.set('movement_type', filters.movement_type);
  
  const res = await fetch(`${API_BASE}/tool-requests?${params}`, { headers: getHeaders() });
  return res.json();
}

export async function createToolRequestApi(data: unknown) {
  const res = await fetch(`${API_BASE}/tool-requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateToolRequestStatusApi(id: string, status: string, approved_by?: string) {
  const res = await fetch(`${API_BASE}/tool-requests?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, approved_by }),
  });
  return res.json();
}

// Maintenance API
export async function getMaintenanceApi(filters?: { status?: string; tool_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.tool_id) params.set('tool_id', filters.tool_id);
  
  const res = await fetch(`${API_BASE}/maintenance?${params}`, { headers: getHeaders() });
  return res.json();
}

export async function createMaintenanceApi(data: unknown) {
  const res = await fetch(`${API_BASE}/maintenance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMaintenanceStatusApi(id: string, status: string, performed_by?: string) {
  const res = await fetch(`${API_BASE}/maintenance?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, performed_by }),
  });
  return res.json();
}

// Financial Requests API
export async function getFinancialRequestsApi(filters?: { status?: string; requested_by?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.requested_by) params.set('requested_by', filters.requested_by);
  
  const res = await fetch(`${API_BASE}/financial-requests?${params}`, { headers: getHeaders() });
  return res.json();
}

export async function createFinancialRequestApi(data: unknown) {
  const res = await fetch(`${API_BASE}/financial-requests`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateFinancialRequestStatusApi(id: string, status: string, approved_by?: string, notes?: string) {
  const res = await fetch(`${API_BASE}/financial-requests?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status, approved_by, notes }),
  });
  return res.json();
}