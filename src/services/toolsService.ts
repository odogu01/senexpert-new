// @ts-nocheck
/**
 * Tools Service — Server-only
 *
 * Domain operations over the repository layer.
 * All audit-log coordination stays here (repositories are pure data access).
 */
import type {
  Tool, ToolInsert, ToolUpdate, ToolRequest, Maintenance,
  Alert, FinancialRequest, AuditLog, ToolStatus, ToolRequestStatus,
  MaintenanceStatus, AlertType,
} from '@/lib/database.types';

import {
  ToolRepository,
  ToolRequestRepository,
  FinancialRequestRepository,
  MaintenanceRepository,
  AlertRepository,
  AuditLogRepository,
} from './repositories';

// ───────── Shared instances ─────────
const toolRepo = new ToolRepository();
const toolRequestRepo = new ToolRequestRepository();
const financialRequestRepo = new FinancialRequestRepository();
const maintenanceRepo = new MaintenanceRepository();
const alertRepo = new AlertRepository();
const auditRepo = new AuditLogRepository();

// ───────── Audit log helper ─────────

async function logAuditEvent(params: {
  userId?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  try {
    await auditRepo.insertOne({
      user_id: params.userId,
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
// TOOLS CRUD
// ============================================

export async function getTools(filters?: {
  category?: string;
  status?: string;
  location?: string;
  search?: string;
}): Promise<{ success: boolean; data?: Tool[]; error?: string }> {
  try {
    const { data } = await toolRepo.findAllFiltered(filters);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get tools error:', error);
    return { success: false, error: 'Failed to fetch tools' };
  }
}

export async function getToolsPaginated(filters?: {
  category?: string;
  status?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data?: Tool[]; total?: number; error?: string }> {
  try {
    const { data, total } = await toolRepo.findAllFiltered(filters);
    return { success: true, data: data as any, total };
  } catch (error) {
    console.error('Get tools paginated error:', error);
    return { success: false, error: 'Failed to fetch tools' };
  }
}

export async function getToolById(id: string): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const tool = await toolRepo.findById(id);
    if (!tool) return { success: false, error: 'Tool not found' };
    return { success: true, data: tool as any };
  } catch (error) {
    console.error('Get tool error:', error);
    return { success: false, error: 'Failed to fetch tool' };
  }
}

export async function createTool(tool: ToolInsert): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const newTool = await toolRepo.insertOne({
      name: tool.name,
      work_order_number: tool.work_order_number,
      size_thread: tool.size_thread,
      material: tool.material,
      model: tool.model,
      material_no: tool.material_no,
      part_number: tool.part_number,
      category: tool.category || 'Saleable',
      quantity: tool.quantity || 1,
      min_quantity: tool.min_quantity,
      status: tool.status || 'available',
      location: tool.location,
      image_url: tool.image_url,
      description: tool.description,
      purchase_date: tool.purchase_date,
      purchase_price: tool.purchase_price,
      created_by: tool.created_by,
      received_from: tool.received_from,
      received_by: tool.received_by,
      vehicle_number: tool.vehicle_number,
    });

    await logAuditEvent({
      action: 'INSERT',
      tableName: 'tools',
      recordId: newTool.id,
      newValues: tool as any,
    });

    return { success: true, data: newTool as any };
  } catch (error) {
    console.error('Create tool error:', error);
    return { success: false, error: 'Failed to create tool' };
  }
}

export async function updateTool(id: string, updates: ToolUpdate): Promise<{ success: boolean; data?: Tool; error?: string }> {
  try {
    const result = await toolRepo.updateWithAutoDelete(id, updates as any);

    if (result.error) return { success: false, error: result.error };

    if (result.deleted) {
      await logAuditEvent({
        action: 'DELETE',
        tableName: 'tools',
        recordId: id,
        oldValues: result.data as any,
        newValues: { ...updates, _deleted: true } as any,
      });
      return { success: true, data: result.data as any };
    }

    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'tools',
      recordId: id,
      oldValues: await toolRepo.findById(id).catch(() => null) as any,
      newValues: updates as any,
    });

    return { success: true, data: result.data as any };
  } catch (error) {
    console.error('Update tool error:', error);
    return { success: false, error: 'Failed to update tool' };
  }
}

export async function deleteTool(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const oldTool = await toolRepo.deleteOneWithDoc(id);
    if (!oldTool) return { success: false, error: 'Tool not found' };

    await logAuditEvent({
      action: 'DELETE',
      tableName: 'tools',
      recordId: id,
      oldValues: oldTool as any,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete tool error:', error);
    return { success: false, error: 'Failed to delete tool' };
  }
}

export async function getCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const categories = await toolRepo.getCategories();
    return { success: true, data: categories };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// ============================================
// TOOL REQUESTS
// ============================================

export async function getToolRequests(filters?: {
  status?: string;
  movement_type?: string;
}): Promise<{ success: boolean; data?: ToolRequest[]; error?: string }> {
  try {
    const data = await toolRequestRepo.findAllFiltered(filters);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get tool requests error:', error);
    return { success: false, error: 'Failed to fetch tool requests' };
  }
}

export async function createToolRequest(request: {
  tool_id: string;
  movement_type: 'incoming' | 'outgoing';
  transaction_type?: 'sold' | 'rented';
  requested_by?: string;
  assigned_to?: string;
  quantity: number;
  notes?: string;
  location?: string;
  vehicle_no?: string;
  delivered_to?: string;
  delivered_by?: string;
  received_by?: string;
  received_from?: string;
}): Promise<{ success: boolean; data?: ToolRequest; error?: string }> {
  try {
    const newRequest = await toolRequestRepo.insertOne({
      tool_id: request.tool_id,
      movement_type: request.movement_type,
      transaction_type: request.transaction_type,
      requested_by: request.requested_by,
      assigned_to: request.assigned_to,
      quantity: request.quantity,
      status: 'pending',
      notes: request.notes,
      location: request.location,
      vehicle_no: request.vehicle_no,
      delivered_to: request.delivered_to,
      delivered_by: request.delivered_by,
      received_by: request.received_by,
      received_from: request.received_from,
      request_date: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'INSERT',
      tableName: 'tool_requests',
      recordId: newRequest.id,
      newValues: request as any,
    });

    return { success: true, data: newRequest as any };
  } catch (error) {
    console.error('Create tool request error:', error);
    return { success: false, error: 'Failed to create tool request' };
  }
}

export async function updateToolRequestStatus(
  id: string,
  status: 'approved' | 'rejected' | 'completed',
  approved_by?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldRequest = await toolRequestRepo.findById(id);

    const updates: Record<string, any> = { status };
    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date();
      
      // Handle tool quantity logic for approved outgoing requests
      if (oldRequest?.movement_type === 'outgoing' && oldRequest?.tool_id) {
        const tool = await toolRepo.findById(oldRequest.tool_id);
        if (tool) {
          if (oldRequest.transaction_type === 'sold') {
            // Reduce quantity for sold tools
            const newQuantity = Math.max(0, tool.quantity - oldRequest.quantity);
            await toolRepo.updateOneRaw(oldRequest.tool_id, { quantity: newQuantity });
            
            // If quantity becomes 0, delete the tool (existing auto-delete logic)
            if (newQuantity === 0) {
              await toolRepo.deleteOne(oldRequest.tool_id);
            }
          } else if (oldRequest.transaction_type === 'rented') {
            // Reduce quantity + mark as rentals
            const newQuantity = Math.max(0, tool.quantity - oldRequest.quantity);
            await toolRepo.updateOneRaw(oldRequest.tool_id, { quantity: newQuantity, status: 'rentals' });
            
            if (newQuantity === 0) {
              await toolRepo.deleteOne(oldRequest.tool_id);
            }
          }
        }
      }
    } else if (status === 'completed') {
      updates.completed_at = new Date();
      
      // Handle incoming requests (returns)
      if (oldRequest?.movement_type === 'incoming' && oldRequest?.tool_id) {
        const tool = await toolRepo.findById(oldRequest.tool_id);
        if (tool && oldRequest.transaction_type === 'rented') {
          // Return rented tool - add quantity back + mark as available
          const newQuantity = tool.quantity + oldRequest.quantity;
          await toolRepo.updateOneRaw(oldRequest.tool_id, { quantity: newQuantity, status: 'available' });
        }
      }
    }

    const { matchedCount } = await toolRequestRepo.updateOneRaw(id, updates);
    if (!matchedCount) return { success: false, error: 'Request not found' };

    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'tool_requests',
      recordId: id,
      oldValues: oldRequest as any,
      newValues: { status, ...(approved_by && { approved_by }) },
    });

    return { success: true };
  } catch (error) {
    console.error('Update tool request error:', error);
    return { success: false, error: 'Failed to update tool request' };
  }
}

// ============================================
// MAINTENANCE
// ============================================

export async function getMaintenanceRecords(filters?: {
  status?: string;
  tool_id?: string;
}): Promise<{ success: boolean; data?: Maintenance[]; error?: string }> {
  try {
    const data = await maintenanceRepo.findAllFiltered(filters);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get maintenance error:', error);
    return { success: false, error: 'Failed to fetch maintenance records' };
  }
}

export async function createMaintenanceRecord(record: {
  tool_id: string;
  maintenance_type: 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other';
  description: string;
  scheduled_date: string;
  cost?: number;
  notes?: string;
}): Promise<{ success: boolean; data?: Maintenance; error?: string }> {
  try {
    const newRecord = await maintenanceRepo.insertOne({
      tool_id: record.tool_id,
      maintenance_type: record.maintenance_type,
      description: record.description,
      status: 'scheduled',
      scheduled_date: record.scheduled_date,
      cost: record.cost,
      notes: record.notes,
    });

    await logAuditEvent({
      action: 'INSERT',
      tableName: 'maintenance',
      recordId: newRecord.id,
      newValues: record as any,
    });

    return { success: true, data: newRecord as any };
  } catch (error) {
    console.error('Create maintenance error:', error);
    return { success: false, error: 'Failed to create maintenance record' };
  }
}

export async function updateMaintenanceStatus(
  id: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  performed_by?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldRecord = await maintenanceRepo.findById(id);

    const updates: Record<string, any> = { status };
    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
      updates.performed_by = performed_by;
    }

    const { matchedCount } = await maintenanceRepo.updateOneRaw(id, updates);
    if (!matchedCount) return { success: false, error: 'Maintenance record not found' };

    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'maintenance',
      recordId: id,
      oldValues: oldRecord as any,
      newValues: { status, ...(performed_by && { performed_by }) },
    });

    return { success: true };
  } catch (error) {
    console.error('Update maintenance error:', error);
    return { success: false, error: 'Failed to update maintenance record' };
  }
}

// ============================================
// ALERTS
// ============================================

export async function getAlerts(unreadOnly = false): Promise<{ success: boolean; data?: Alert[]; error?: string }> {
  try {
    const data = await alertRepo.findAllFiltered(unreadOnly);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get alerts error:', error);
    return { success: false, error: 'Failed to fetch alerts' };
  }
}

export async function markAlertAsRead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await alertRepo.markAsRead(id);
    if (!ok) return { success: false, error: 'Alert not found' };
    return { success: true };
  } catch (error) {
    console.error('Mark alert error:', error);
    return { success: false, error: 'Failed to mark alert as read' };
  }
}

export async function createAlert(alert: {
  title: string;
  description?: string;
  type: AlertType;
  category?: string;
  tool_id?: string;
  created_by?: string;
}): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    const newAlert = await alertRepo.insertOne({
      title: alert.title,
      description: alert.description,
      type: alert.type,
      category: alert.category,
      tool_id: alert.tool_id,
      is_read: false,
      created_by: alert.created_by,
    });

    return { success: true, data: newAlert as any };
  } catch (error) {
    console.error('Create alert error:', error);
    return { success: false, error: 'Failed to create alert' };
  }
}

// ============================================
// DASHBOARD STATS
// ============================================

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
    const tools = await toolRepo.findRaw({ quantity: { $gt: 0 } });

    const totalTools = tools.reduce((sum: number, t: any) => sum + t.quantity, 0);
    const available = tools.filter((t: any) => t.status === 'available').length;
    const inUse = tools.filter((t: any) => t.status === 'in_use').length;
    const maintenance = tools.filter((t: any) => t.status === 'maintenance').length;
    const lowStock = tools.filter((t: any) => t.quantity <= (t.min_quantity || 1)).length;

    const pendingRequests = await toolRequestRepo.countDocuments({ status: 'pending' });

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingMaintenance = await maintenanceRepo.countDocuments({
      status: 'scheduled',
      scheduled_date: { $lte: sevenDaysFromNow.toISOString() },
    });

    const pendingFinancialRequests = await financialRequestRepo.countDocuments({ status: 'pending' });

    const approvedFinData = await financialRequestRepo.findAll({ status: 'approved' });
    const approvedFinancialRequests = approvedFinData.length;
    const totalFinancialAmount = approvedFinData.reduce((sum, r: any) => sum + Number(r.amount), 0);

    return {
      success: true,
      data: {
        totalTools, available, inUse, maintenance, lowStock,
        pendingRequests, upcomingMaintenance,
        pendingFinancialRequests, approvedFinancialRequests, totalFinancialAmount,
      },
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}

// ============================================
// FINANCIAL REQUESTS
// ============================================

export async function getFinancialRequests(filters?: {
  status?: string;
  requested_by?: string;
}): Promise<{ success: boolean; data?: FinancialRequest[]; error?: string }> {
  try {
    const data = await financialRequestRepo.findAllFiltered(filters);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get financial requests error:', error);
    return { success: false, error: 'Failed to fetch financial requests' };
  }
}

export async function createFinancialRequest(request: {
  title: string;
  description: string;
  amount: number;
  category: string;
  requested_by?: string;
}): Promise<{ success: boolean; data?: FinancialRequest; error?: string }> {
  try {
    const newRequest = await financialRequestRepo.insertOne({
      title: request.title,
      description: request.description,
      amount: request.amount,
      category: request.category,
      requested_by: request.requested_by,
      status: 'pending',
    });

    await logAuditEvent({
      action: 'INSERT',
      tableName: 'financial_requests',
      recordId: newRequest.id,
      newValues: request as any,
    });

    return { success: true, data: newRequest as any };
  } catch (error) {
    console.error('Create financial request error:', error);
    return { success: false, error: 'Failed to create financial request' };
  }
}

export async function updateFinancialRequestStatus(
  id: string,
  status: 'approved' | 'rejected',
  approved_by?: string,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldRequest = await financialRequestRepo.findById(id);

    const updates: Record<string, any> = { status, notes };
    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date();
    }

    const { matchedCount } = await financialRequestRepo.updateOneRaw(id, updates);
    if (!matchedCount) return { success: false, error: 'Request not found' };

    await logAuditEvent({
      userId: approved_by,
      action: 'UPDATE',
      tableName: 'financial_requests',
      recordId: id,
      oldValues: oldRequest as any,
      newValues: { status, notes },
    });

    return { success: true };
  } catch (error) {
    console.error('Update financial request error:', error);
    return { success: false, error: 'Failed to update financial request' };
  }
}

// ============================================
// ACTIVITY FEED & AUDIT LOGS
// ============================================

export async function getRecentActivity(limit = 10): Promise<{
  success: boolean;
  data?: AuditLog[];
  error?: string;
}> {
  try {
    const data = await auditRepo.getRecent(limit);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get recent activity error:', error);
    return { success: false, error: 'Failed to fetch activity' };
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  tableName?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}): Promise<{
  success: boolean;
  data?: AuditLog[];
  error?: string;
}> {
  try {
    const data = await auditRepo.findAllFiltered(filters);
    return { success: true, data: data as any };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}
