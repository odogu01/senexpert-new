/**
 * Database type definitions for SenExpert
 * Based on the Supabase database schema
 */

export type UserRole = 'super_admin' | 'admin' | 'hr' | 'manager';

export type ToolStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'rentals';
export type ToolRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type MovementType = 'incoming' | 'outgoing';
export type MaintenanceType = 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AlertType = 'info' | 'warning' | 'critical' | 'success';

export interface FinancialRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  requested_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  requested_by_profile?: { full_name: string };
  approved_by_profile?: { full_name: string };
}

export interface Tool {
  id: string;
  name: string;
  work_order_number: string;
  size_thread?: string;
  material?: string;
  model?: string;
  part_number?: string;
  category: string;
  quantity: number;
  min_quantity?: number;
  status: ToolStatus;
  location?: string;
  image_url?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  created_at: string;
  updated_at: string;
}

export interface ToolInsert {
  name: string;
  work_order_number: string;
  size_thread?: string;
  material?: string;
  model?: string;
  part_number?: string;
  category?: string;
  quantity?: number;
  min_quantity?: number;
  status?: ToolStatus;
  location?: string;
  image_url?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  packing_list_no?: string;
  packing_info?: string;
}

export interface ToolUpdate {
  name?: string;
  work_order_number?: string;
  size_thread?: string;
  material?: string;
  model?: string;
  part_number?: string;
  category?: string;
  quantity?: number;
  min_quantity?: number;
  status?: ToolStatus;
  location?: string;
  image_url?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  updated_at?: string;
}

export interface ToolRequest {
  id: string;
  tool_id?: string;
  movement_type: MovementType;
  requested_by?: string;
  assigned_to?: string;
  quantity: number;
  status: ToolRequestStatus;
  notes?: string;
  request_date?: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  tool?: Tool;
  requested_by_profile?: { full_name: string };
  assigned_to_profile?: { full_name: string };
}

export interface Maintenance {
  id: string;
  tool_id?: string;
  maintenance_type: MaintenanceType;
  description: string;
  status: MaintenanceStatus;
  scheduled_date: string;
  completed_date?: string;
  performed_by?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields
  tool?: { name: string; serial_number: string };
  performed_by_profile?: { full_name: string };
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  type: AlertType;
  category?: string;
  tool_id?: string;
  is_read: boolean;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: unknown;
  user_agent?: string;
  created_at: string;
}