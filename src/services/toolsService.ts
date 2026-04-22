/**
 * Tools Service - MongoDB operations for tool inventory
 * Uses dynamic imports to avoid bundling Node.js modules in the browser
 */

import type { Tool, ToolInsert, ToolUpdate, ToolRequest, Maintenance, Alert, FinancialRequest, AuditLog, ToolStatus, ToolRequestStatus, MaintenanceStatus, AlertType } from '@/lib/database.types';

// ============================================
// Dynamic import helpers (for server-side only)
// ============================================

async function getDb() {
  const { getCollection } = await import('@/lib/mongodb');
  return { getCollection };
}

async function getMongodbModule() {
  return import('mongodb');
}

/**
 * Tools Service - MongoDB operations for tool inventory
 */

// ============================================
// Collections
// ============================================

async function getToolsCollection() {
  const { getCollection } = await getDb();
  return getCollection<Tool>('tools');
}

async function getToolRequestsCollection() {
  const { getCollection } = await getDb();
  return getCollection<ToolRequest>('tool_requests');
}

async function getMaintenanceCollection() {
  const { getCollection } = await getDb();
  return getCollection<Maintenance>('maintenance');
}

async function getAlertsCollection() {
  const { getCollection } = await getDb();
  return getCollection<Alert>('alerts');
}

async function getFinancialRequestsCollection() {
  const { getCollection } = await getDb();
  return getCollection<FinancialRequest>('financial_requests');
}

async function getAuditLogsCollection() {
  const { getCollection } = await getDb();
  return getCollection<AuditLog>('audit_logs');
}

async function getProfilesCollection() {
  const { getCollection } = await getDb();
  return getCollection<{ _id: unknown; email: string; full_name: string }>('profiles');
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
    const { getCollection } = await getDb();
    const auditCollection = getCollection<AuditLog>('audit_logs');
    await auditCollection.insertOne({
      user_id: params.userId,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      old_values: params.oldValues,
      new_values: params.newValues,
      created_at: new Date(),
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();

    const query: Record<string, unknown> = {};

    if (filters?.category) {
      query.category = filters.category;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { work_order_number: { $regex: filters.search, $options: 'i' } },
        { part_number: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const tools = await collection.find(query).sort({ name: 1 }).toArray();
    
    // Add id field for frontend compatibility
    const toolsWithId = tools.map(tool => ({
      ...tool,
      id: tool._id?.toString() || '',
    }));
    
    return { success: true, data: toolsWithId };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid tool ID' };
    }

    const tool = await collection.findOne({ _id: objectId });

    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }

    return { success: true, data: { ...tool, id: tool._id?.toString() || '' } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();
    const mongodb = await getMongodbModule();

    const newTool: Tool = {
      _id: new mongodb.ObjectId(),
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
      created_at: new Date(),
      updated_at: new Date(),
    };

    await collection.insertOne(newTool);

    // Log audit event
    await logAuditEvent({
      action: 'INSERT',
      tableName: 'tools',
      recordId: newTool._id.toString(),
      newValues: tool as unknown as Record<string, unknown>,
    });

    return { success: true, data: { ...newTool, id: newTool._id.toString() } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid tool ID' };
    }

    // Get old values for audit
    const oldTool = await collection.findOne({ _id: objectId });

    const updateFields = {
      ...updates,
      updated_at: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return { success: false, error: 'Tool not found' };
    }

    // Log audit event
    await logAuditEvent({
      action: 'UPDATE',
      tableName: 'tools',
      recordId: id,
      oldValues: oldTool as unknown as Record<string, unknown>,
      newValues: updates as unknown as Record<string, unknown>,
    });

    return { success: true, data: { ...result, id: result._id?.toString() || id } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid tool ID' };
    }

    // Get old values for audit
    const oldTool = await collection.findOne({ _id: objectId });

    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Tool not found' };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolsCollection();

    const categories = await collection.distinct('category');
    return { success: true, data: categories as string[] };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolRequestsCollection();

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.movement_type) {
      query.movement_type = filters.movement_type;
    }

    const requests = await collection.find(query).sort({ created_at: -1 }).toArray();
    
    const requestsWithId = requests.map(req => ({
      ...req,
      id: req._id?.toString() || '',
    }));
    
    return { success: true, data: requestsWithId };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolRequestsCollection();
    const mongodb = await getMongodbModule();

    const newRequest: ToolRequest = {
      _id: new mongodb.ObjectId(),
      tool_id: request.tool_id,
      movement_type: request.movement_type,
      requested_by: request.requested_by,
      assigned_to: request.assigned_to,
      quantity: request.quantity,
      status: 'pending',
      notes: request.notes,
      request_date: new Date().toISOString(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await collection.insertOne(newRequest);

    // Log audit event
    await logAuditEvent({
      action: 'INSERT',
      tableName: 'tool_requests',
      recordId: newRequest._id.toString(),
      newValues: request as unknown as Record<string, unknown>,
    });

    return { success: true, data: { ...newRequest, id: newRequest._id.toString() } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getToolRequestsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid request ID' };
    }

    // Get old values for audit
    const oldRequest = await collection.findOne({ _id: objectId });

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date(),
    };

    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date();
    } else if (status === 'completed') {
      updates.completed_at = new Date();
    }

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Request not found' };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getMaintenanceCollection();

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.tool_id) {
      query.tool_id = filters.tool_id;
    }

    const records = await collection.find(query).sort({ scheduled_date: 1 }).toArray();
    
    const recordsWithId = records.map(rec => ({
      ...rec,
      id: rec._id?.toString() || '',
    }));
    
    return { success: true, data: recordsWithId };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getMaintenanceCollection();
    const mongodb = await getMongodbModule();

    const newRecord: Maintenance = {
      _id: new mongodb.ObjectId(),
      tool_id: record.tool_id,
      maintenance_type: record.maintenance_type,
      description: record.description,
      status: 'scheduled',
      scheduled_date: record.scheduled_date,
      cost: record.cost,
      notes: record.notes,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await collection.insertOne(newRecord);

    // Log audit event
    await logAuditEvent({
      action: 'INSERT',
      tableName: 'maintenance',
      recordId: newRecord._id.toString(),
      newValues: record as unknown as Record<string, unknown>,
    });

    return { success: true, data: { ...newRecord, id: newRecord._id.toString() } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getMaintenanceCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid maintenance ID' };
    }

    // Get old values for audit
    const oldMaintenance = await collection.findOne({ _id: objectId });

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date(),
    };

    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
      updates.performed_by = performed_by;
    }

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Maintenance record not found' };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getAlertsCollection();

    const query: Record<string, unknown> = {};
    if (unreadOnly) {
      query.is_read = false;
    }

    const alerts = await collection.find(query).sort({ created_at: -1 }).toArray();
    
    const alertsWithId = alerts.map(alert => ({
      ...alert,
      id: alert._id?.toString() || '',
    }));
    
    return { success: true, data: alertsWithId };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getAlertsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid alert ID' };
    }

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { is_read: true } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Alert not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Mark alert error:', error);
    return { success: false, error: 'Failed to mark alert as read' };
  }
}

/**
 * Create alert
 */
export async function createAlert(alert: {
  title: string;
  description?: string;
  type: AlertType;
  category?: string;
  tool_id?: string;
  created_by?: string;
}): Promise<{ success: boolean; data?: Alert; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getAlertsCollection();
    const mongodb = await getMongodbModule();

    const newAlert: Alert = {
      _id: new mongodb.ObjectId(),
      title: alert.title,
      description: alert.description,
      type: alert.type,
      category: alert.category,
      tool_id: alert.tool_id,
      is_read: false,
      created_by: alert.created_by,
      created_at: new Date(),
    };

    await collection.insertOne(newAlert);
    return { success: true, data: { ...newAlert, id: newAlert._id.toString() } };
  } catch (error) {
    console.error('Create alert error:', error);
    return { success: false, error: 'Failed to create alert' };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    
    const toolsCollection = await getToolsCollection();
    const toolRequestsCollection = await getToolRequestsCollection();
    const maintenanceCollection = await getMaintenanceCollection();
    const financialRequestsCollection = await getFinancialRequestsCollection();

    // Get tools counts
    const tools = await toolsCollection.find({}).toArray();
    
    const totalTools = tools.reduce((sum, t) => sum + t.quantity, 0);
    const available = tools.filter(t => t.status === 'available').length;
    const inUse = tools.filter(t => t.status === 'in_use').length;
    const maintenance = tools.filter(t => t.status === 'maintenance').length;
    const lowStock = tools.filter(t => t.quantity <= (t.min_quantity || 1)).length;

    // Get pending tool requests
    const pendingRequests = await toolRequestsCollection.countDocuments({ status: 'pending' });

    // Get upcoming maintenance (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingMaintenance = await maintenanceCollection.countDocuments({
      status: 'scheduled',
      scheduled_date: { $lte: sevenDaysFromNow.toISOString() },
    });

    // Get financial requests stats
    const pendingFinancialRequests = await financialRequestsCollection.countDocuments({ status: 'pending' });
    
    const approvedFinancialRequestsData = await financialRequestsCollection
      .find({ status: 'approved' })
      .toArray();

    const approvedFinancialRequests = approvedFinancialRequestsData.length;
    const totalFinancialAmount = approvedFinancialRequestsData.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      success: true,
      data: {
        totalTools,
        available,
        inUse,
        maintenance,
        lowStock,
        pendingRequests,
        upcomingMaintenance,
        pendingFinancialRequests,
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
}): Promise<{ success: boolean; data?: FinancialRequest[]; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getFinancialRequestsCollection();

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.requested_by) {
      query.requested_by = filters.requested_by;
    }

    const requests = await collection.find(query).sort({ created_at: -1 }).toArray();
    
    const requestsWithId = requests.map(req => ({
      ...req,
      id: req._id?.toString() || '',
    }));
    
    return { success: true, data: requestsWithId };
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
}): Promise<{ success: boolean; data?: FinancialRequest; error?: string }> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getFinancialRequestsCollection();
    const mongodb = await getMongodbModule();

    const newRequest: FinancialRequest = {
      _id: new mongodb.ObjectId(),
      title: request.title,
      description: request.description,
      amount: request.amount,
      category: request.category,
      requested_by: request.requested_by,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };

    await collection.insertOne(newRequest);

    // Log audit event
    await logAuditEvent({
      action: 'INSERT',
      tableName: 'financial_requests',
      recordId: newRequest._id.toString(),
      newValues: request as unknown as Record<string, unknown>,
    });

    return { success: true, data: { ...newRequest, id: newRequest._id.toString() } };
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getFinancialRequestsCollection();
    const mongodb = await getMongodbModule();

    let objectId: mongodb.ObjectId;
    try {
      objectId = new mongodb.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid request ID' };
    }

    // Get old values for audit
    const oldRequest = await collection.findOne({ _id: objectId });

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date(),
      notes,
    };

    if (status === 'approved') {
      updates.approved_by = approved_by;
      updates.approved_at = new Date();
    }

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Request not found' };
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

// ============================================
// Activity Feed
// ============================================

/**
 * Get recent audit logs for activity feed
 */
export async function getRecentActivity(limit = 10): Promise<{
  success: boolean;
  data?: AuditLog[];
  error?: string;
}> {
  try {
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getAuditLogsCollection();

    const logs = await collection
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    // Add id field for frontend compatibility
    const logsWithId = logs.map(log => ({
      ...log,
      id: log._id?.toString() || '',
    }));

    return { success: true, data: logsWithId };
  } catch (error) {
    console.error('Get recent activity error:', error);
    return { success: false, error: 'Failed to fetch activity' };
  }
}

/**
 * Get audit logs with optional filters
 */
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
    await import('@/lib/mongodb').then(m => m.connectToDatabase());
    const collection = await getAuditLogsCollection();

    const query: Record<string, unknown> = {};

    if (filters?.userId) {
      query.user_id = filters.userId;
    }
    if (filters?.action) {
      query.action = filters.action;
    }
    if (filters?.tableName) {
      query.table_name = filters.tableName;
    }
    if (filters?.startDate || filters?.endDate) {
      query.created_at = {};
      if (filters?.startDate) {
        (query.created_at as Record<string, Date>).$gte = filters.startDate;
      }
      if (filters?.endDate) {
        (query.created_at as Record<string, Date>).$lte = filters.endDate;
      }
    }

    const logs = await collection
      .find(query)
      .sort({ created_at: -1 })
      .limit(filters?.limit || 50)
      .skip(filters?.skip || 0)
      .toArray();

    // Add id field for frontend compatibility
    const logsWithId = logs.map(log => ({
      ...log,
      id: log._id?.toString() || '',
    }));

    return { success: true, data: logsWithId };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}