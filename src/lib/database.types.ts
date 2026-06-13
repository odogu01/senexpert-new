/**
 * Database type definitions for SenExpert
 * MongoDB schema with string IDs for API compatibility
 */

import { ObjectId } from 'mongodb';

export type UserRole = 'super_admin' | 'admin' | 'hr' | 'accountant' | 'field' | 'operator';

export type ToolStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'rentals';
export type ToolRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type MovementType = 'incoming' | 'outgoing';
export type MaintenanceType = 'inspection' | 'repair' | 'calibration' | 'replacement' | 'cleaning' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AlertType = 'info' | 'warning' | 'critical' | 'success';

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export function isValidObjectId(id: string): boolean {
  try {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
  } catch {
    return false;
  }
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
  updated_at?: Date;
  is_active?: boolean;
  avatar_url?: string;
}

export interface Tool {
  id: string;
  name: string;
  work_order_number: string;
  size_thread?: string;
  material?: string;
  model?: string;
  material_no?: string;
  part_number?: string;
  category: string;
  quantity: number;
  initial_quantity?: number;
  min_quantity?: number;
  status: ToolStatus;
  location?: string;
  image_url?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
  created_by?: string;
  created_at: Date;
  updated_at?: Date;
  // Receiving details
  received_from?: string;
  received_by?: string;
  vehicle_number?: string;
}

export interface ToolInsert {
  name: string;
  work_order_number: string;
  size_thread?: string;
  material?: string;
  model?: string;
  material_no?: string;
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
  created_by?: string;
  // Receiving details
  received_from?: string;
  received_by?: string;
  vehicle_number?: string;
}

export interface ToolUpdate {
  name?: string;
  work_order_number?: string;
  size_thread?: string;
  material?: string;
  model?: string;
  material_no?: string;
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
  updated_at?: Date;
}

export interface ToolRequest {
  id: string;
  tool_id?: string;
  movement_type: MovementType;
  transaction_type?: 'sold' | 'rented';
  requested_by?: string;
  assigned_to?: string;
  quantity: number;
  status: ToolRequestStatus;
  notes?: string;
  location?: string;
  request_date?: string;
  approved_by?: string;
  approved_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at?: Date;
  tool_name?: string;
  requester_name?: string;
  // New fields for tracking
  vehicle_no?: string;
  delivered_to?: string;
  delivered_by?: string;
  received_by?: string;
  received_from?: string;
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
  created_at: Date;
  updated_at?: Date;
  tool_name?: string;
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
  created_at: Date;
  updated_at?: Date;
}

export interface FinancialRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  requested_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
  requester_name?: string;
  requested_by_profile?: { full_name: string };
  approved_by_profile?: { full_name: string };
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: AuthError | null;
}