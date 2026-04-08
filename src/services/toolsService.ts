import { supabase } from '@/lib/supabase';
import type { Tool, ToolInsert, ToolUpdate, ToolRequest, Maintenance, Alert } from '@/lib/database.types';

/**
 * Tools Service - Database operations for tool inventory
 */

function getClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// ============================================
// Audit Log Helper
// ============================================

async function logAuditEvent(params: {
  userId?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  try {
    const client = getClient();
    // Try to get current user from auth
    const { data: { user } } = await client.auth.getUser();
    
    await client.from('audit_logs').insert({
      user_id: params.userId || user?.id,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      old_values: params.oldValues,
      new_values: params.newValues,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// ============================================
// Tools CRUD Operations
// ============================================

/**
 * Get all tools with optional filters
 */
export async function getTools(filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<{ success: boolean; data?: Tool[]; error?: string }> {
  try {
    const client = getClient();
    let query = client.from('tools').select('*').order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,work_order_number.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Tool[] };
  } catch (error) {
    console.error('Get tools error:', error);
    return { success: false, error: 'Failed to fetch tools' };
  }
}

/**
 * Get tool by ID
 */
export async function getToolById(id: string): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Tool };
  } catch (error) {
    console.error('Get tool error:', error);
    return { success: false, error: 'Failed to fetch tool' };
  }
}

/**
 * Create new tool
 */
export async function createTool(tool: ToolInsert): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tools')
      .insert(tool)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    if (data) {
      await logAuditEvent({
        action: 'INSERT',
        tableName: 'tools',
        recordId: data.id,
        newValues: tool as unknown as Record<string, unknown>,
      });
    }

    return { success: true, data: data as Tool };
  } catch (error) {
    console.error('Create tool error:', error);
    return { success: false, error: 'Failed to create tool' };
  }
}

/**
 * Update tool
 */
export async function updateTool(id: string, updates: ToolUpdate): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const client = getClient();
    
    // Get old values for audit
    const { data: oldTool } = await client
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await client
      .from('tools')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    if (data) {
      await logAuditEvent({
        action: 'UPDATE',
        tableName: 'tools',
        recordId: id,
        oldValues: oldTool as unknown as Record<string, unknown>,
        newValues: updates as unknown as Record<string, unknown>,
      });
    }

    return { success: true, data: data as Tool };
  } catch (error) {
    console.error('Update tool error:', error);
    return { success: false, error: 'Failed to update tool' };
  }
}

/**
 * Delete tool
 */
export async function deleteTool(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    
    // Get old values for audit
    const { data: oldTool } = await client
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await client
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    await logAuditEvent({
      action: 'DELETE',
      tableName: 'tools',
      recordId: id,
      oldValues: oldTool as unknown as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete tool error:', error);
    return { success: false, error: 'Failed to delete tool' };
  }
}

/**
 * Get tool categories
 */
export async function getCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tools')
      .select('category')
      .order('category');

    if (error) {
      return { success: false, error: error.message };
    }

    const categories = [...new Set(data.map(t => t.category).filter(Boolean))] as string[];
    return { success: true, data: categories };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// ============================================
// Tool Requests CRUD Operations
// ============================================

/**
 * Get tool requests with optional filters
 */
export async function getToolRequests(filters?: {
  status?: string;
  movement_type?: string;
}): Promise<{ success: boolean; data?: ToolRequest[]; error?: string }> {
  try {
    const client = getClient();
    let query = client
      .from('tool_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.movement_type) {
      query = query.eq('movement_type', filters.movement_type);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ToolRequest[] };
  } catch (error) {
    console.error('Get tool requests error:', error);
    return { success: false, error: 'Failed to fetch tool requests' };
  }
}

/**
 * Create tool request
 */
export async function createToolRequest(request: {
  tool_id: string;
  movement_type: 'incoming' | 'outgoing';
  requested_by?: string;
  assigned_to?: string;
  quantity: number;
  notes?: string;
}): Promise<{ success: boolean; data?: ToolRequest; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('tool_requests')
      .insert({
        tool_id: request.tool_id,
        movement_type: request.movement_type,
        requested_by: request.requested_by,
        assigned_to: request.assigned_to,
        quantity: request.quantity,
        notes: request.notes,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    if (data) {
      await logAuditEvent({
        action: 'INSERT',
        tableName: 'tool_requests',
        recordId: data.id,
        newValues: request as unknown as Record<string, unknown>,
      });
    }

    return { success: true, data: data as ToolRequest };
  } catch (error) {
    console.error('Create tool request error:', error);
    return { success: false, error: 'Failed to create tool request' };
  }
}

/**
 * Update tool request status
 */
export async function updateToolRequestStatus(
  id: string,
  status: 'approved' | 'rejected' | 'completed',
  approved_by?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    
    // Get old values for audit
    const { data: oldRequest } = await client
      .from('tool_requests')
      .select('*')
      .eq('id', id)
      .single();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await client
      .from('tool_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'tool_requests',
      recordId: id,
      oldValues: oldRequest as unknown as Record<string, unknown>,
      newValues: { status, ...(approved_by && { approved_by }) },
    });

    return { success: true };
  } catch (error) {
    console.error('Update tool request error:', error);
    return { success: false, error: 'Failed to update tool request' };
  }
}

// ============================================
// Maintenance CRUD Operations
// ============================================

/**
 * Get maintenance records
 */
export async function getMaintenanceRecords(filters?: {
  status?: string;
  tool_id?: string;
}): Promise<{ success: boolean; data?: Maintenance[]; error?: string }> {
  try {
    const client = getClient();
    let query = client
      .from('maintenance')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.tool_id) {
      query = query.eq('tool_id', filters.tool_id);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Maintenance[] };
  } catch (error) {
    console.error('Get maintenance error:', error);
    return { success: false, error: 'Failed to fetch maintenance records' };
  }
}

/**
 * Create maintenance record
 */
export async function createMaintenanceRecord(record: {
  tool_id: string;
  maintenance_type: 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other';
  description: string;
  scheduled_date: string;
  cost?: number;
  notes?: string;
}): Promise<{ success: boolean; data?: Maintenance; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('maintenance')
      .insert(record)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    if (data) {
      await logAuditEvent({
        action: 'INSERT',
        tableName: 'maintenance',
        recordId: data.id,
        newValues: record as unknown as Record<string, unknown>,
      });
    }

    return { success: true, data: data as Maintenance };
  } catch (error) {
    console.error('Create maintenance error:', error);
    return { success: false, error: 'Failed to create maintenance record' };
  }
}

/**
 * Update maintenance status
 */
export async function updateMaintenanceStatus(
  id: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  performed_by?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    
    // Get old values for audit
    const { data: oldMaintenance } = await client
      .from('maintenance')
      .select('*')
      .eq('id', id)
      .single();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.performed_by = performed_by;
    }

    const { error } = await client
      .from('maintenance')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'maintenance',
      recordId: id,
      oldValues: oldMaintenance as unknown as Record<string, unknown>,
      newValues: { status, ...(performed_by && { performed_by }) },
    });

    return { success: true };
  } catch (error) {
    console.error('Update maintenance error:', error);
    return { success: false, error: 'Failed to update maintenance record' };
  }
}

// ============================================
// Alerts Operations
// ============================================

/**
 * Get alerts
 */
export async function getAlerts(unreadOnly = false): Promise<{ success: boolean; data?: Alert[]; error?: string }> {
  try {
    const client = getClient();
    let query = client
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Alert[] };
  } catch (error) {
    console.error('Get alerts error:', error);
    return { success: false, error: 'Failed to fetch alerts' };
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    const { error } = await client
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Mark alert error:', error);
    return { success: false, error: 'Failed to mark alert as read' };
  }
}

// ============================================
// Dashboard Stats
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: {
    totalTools: number;
    available: number;
    inUse: number;
    maintenance: number;
    lowStock: number;
    pendingRequests: number;
    upcomingMaintenance: number;
    pendingFinancialRequests: number;
    approvedFinancialRequests: number;
    totalFinancialAmount: number;
  };
  error?: string;
}> {
  try {
    const client = getClient();
    
    // Get tools counts
    const { data: tools } = await client.from('tools').select('quantity, min_quantity, status');
    
    if (!tools) {
      return { success: false, error: 'Failed to fetch stats' };
    }

    const totalTools = tools.reduce((sum, t) => sum + t.quantity, 0);
    const available = tools.filter(t => t.status === 'available').length;
    const inUse = tools.filter(t => t.status === 'in_use').length;
    const maintenance = tools.filter(t => t.status === 'maintenance').length;
    const lowStock = tools.filter(t => t.quantity <= (t.min_quantity || 1)).length;

    // Get pending tool requests
    const { count: pendingRequests } = await client
      .from('tool_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get upcoming maintenance (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const { count: upcomingMaintenance } = await client
      .from('maintenance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .lte('scheduled_date', sevenDaysFromNow.toISOString());

    // Get financial requests stats
    const { count: pendingFinancialRequests } = await client
      .from('financial_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: approvedFinancialRequestsData } = await client
      .from('financial_requests')
      .select('amount')
      .eq('status', 'approved');

    const approvedFinancialRequests = approvedFinancialRequestsData?.length || 0;
    const totalFinancialAmount = approvedFinancialRequestsData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    return {
      success: true,
      data: {
        totalTools,
        available,
        inUse,
        maintenance,
        lowStock,
        pendingRequests: pendingRequests || 0,
        upcomingMaintenance: upcomingMaintenance || 0,
        pendingFinancialRequests: pendingFinancialRequests || 0,
        approvedFinancialRequests,
        totalFinancialAmount,
      },
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}

// ============================================
// Financial Requests CRUD Operations
// ============================================

/**
 * Get financial requests
 */
export async function getFinancialRequests(filters?: {
  status?: string;
  requested_by?: string;
}): Promise<{ success: boolean; data?: import('@/lib/database.types').FinancialRequest[]; error?: string }> {
  try {
    const client = getClient();
    let query = client
      .from('financial_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.requested_by) {
      query = query.eq('requested_by', filters.requested_by);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as import('@/lib/database.types').FinancialRequest[] };
  } catch (error) {
    console.error('Get financial requests error:', error);
    return { success: false, error: 'Failed to fetch financial requests' };
  }
}

/**
 * Create financial request
 */
export async function createFinancialRequest(request: {
  title: string;
  description: string;
  amount: number;
  category: string;
  requested_by?: string;
}): Promise<{ success: boolean; data?: import('@/lib/database.types').FinancialRequest; error?: string }> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('financial_requests')
      .insert({
        title: request.title,
        description: request.description,
        amount: request.amount,
        category: request.category,
        requested_by: request.requested_by,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    await logAuditEvent({
      action: 'INSERT',
      tableName: 'financial_requests',
      recordId: data.id,
      newValues: request as unknown as Record<string, unknown>,
    });

    return { success: true, data: data as import('@/lib/database.types').FinancialRequest };
  } catch (error) {
    console.error('Create financial request error:', error);
    return { success: false, error: 'Failed to create financial request' };
  }
}

/**
 * Update financial request status (approve/reject)
 */
export async function updateFinancialRequestStatus(
  id: string,
  status: 'approved' | 'rejected',
  approved_by?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();

    // Get old values for audit
    const { data: oldRequest } = await client
      .from('financial_requests')
      .select('*')
      .eq('id', id)
      .single();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      notes,
    };

    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date().toISOString();
    }

    const { error } = await client
      .from('financial_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log audit event
    await logAuditEvent({
      userId: approved_by,
      action: 'UPDATE',
      tableName: 'financial_requests',
      recordId: id,
      oldValues: oldRequest as unknown as Record<string, unknown>,
      newValues: { status, notes },
    });

    return { success: true };
  } catch (error) {
    console.error('Update financial request error:', error);
    return { success: false, error: 'Failed to update financial request' };
  }
}