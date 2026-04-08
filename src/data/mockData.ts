/**
 * Mock Data for Dashboard
 * Contains realistic dummy data for oil & gas tool management system
 */

// ============================================
// Types
// ============================================

export type ToolStatus = 'available' | 'in_use' | 'maintenance' | 'damaged' | 'lost';
export type ToolCategory = 'drilling' | 'safety' | 'electrical' | 'mechanical' | 'pressure';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'tool_outgoing' | 'tool_incoming' | 'finance';
export type UserRole = 'super_admin' | 'admin' | 'hr' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  site: string;
}

export interface Tool {
  id: string;
  name: string;
  sizeThread: string;
  material: string;
  category: ToolCategory;
  quantity: number;
  available: number;
  inUse: number;
  maintenance: number;
  status: ToolStatus;
  location: string;
  serialNumber: string;
  model: string;
  workOrderNumber: string;
  partNumber: string;
  lastMaintenance: string;
  nextMaintenance: string;
  certificationExpiry: string;
  profile?: string;
}

export interface Activity {
  id: string;
  type: 'checkout' | 'checkin' | 'maintenance' | 'added' | 'damaged' | 'transfer';
  description: string;
  user: string;
  tool?: string;
  timestamp: string;
  location?: string;
}

export interface Request {
  id: string;
  type: RequestType;
  status: RequestStatus;
  requester: string;
  tool?: string;
  quantity?: number;
  reason: string;
  amount?: number;
  approver?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  attendees: string[];
  organizer: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  description?: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  tool?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  toolName: string;
  type: 'scheduled' | 'repair' | 'inspection';
  status: 'pending' | 'in_progress' | 'completed';
  startDate: string;
  endDate?: string;
  technician: string;
  notes?: string;
}

// ============================================
// Mock Users
// ============================================

export const mockUsers: User[] = [
  { id: '1', name: 'Super Admin', email: 'superadmin@test.com', role: 'super_admin', department: 'Management', site: 'HQ' },
  { id: '2', name: 'Admin User', email: 'admin@test.com', role: 'admin', department: 'Operations', site: 'HQ' },
  { id: '3', name: 'HR Manager', email: 'hr@test.com', role: 'hr', department: 'Human Resources', site: 'HQ' },
  { id: '4', name: 'Team Manager', email: 'manager@test.com', role: 'manager', department: 'Drilling', site: 'Site A' },
  { id: '5', name: 'John Smith', email: 'john@test.com', role: 'manager', department: 'Maintenance', site: 'Site B' },
  { id: '6', name: 'Sarah Johnson', email: 'sarah@test.com', role: 'manager', department: 'Safety', site: 'Offshore Rig' },
];

// ============================================
// Mock Tools
// ============================================

export const mockTools: Tool[] = [
  { id: 'T001', name: 'Drill Bit 8.5"', sizeThread: '6-5/8" API REG', material: 'Steel/TC', category: 'drilling', quantity: 15, available: 10, inUse: 3, maintenance: 2, status: 'available', location: 'Warehouse A', serialNumber: 'DB-2024-001', model: 'DS-850', workOrderNumber: 'WO-2024-001', partNumber: 'PN-88501', lastMaintenance: '2024-01-15', nextMaintenance: '2024-04-15', certificationExpiry: '2025-01-15' },
  { id: 'T002', name: 'Safety Helmet', sizeThread: 'Standard', material: 'ABS', category: 'safety', quantity: 50, available: 45, inUse: 5, maintenance: 0, status: 'available', location: 'Site A', serialNumber: 'SH-2024-001', model: 'SH-500', workOrderNumber: 'WO-2024-002', partNumber: 'PN-50101', lastMaintenance: '2024-02-01', nextMaintenance: '2024-05-01', certificationExpiry: '2025-02-01' },
  { id: 'T003', name: 'Mud Pump', sizeThread: '5"', material: 'Cast Iron', category: 'mechanical', quantity: 8, available: 3, inUse: 3, maintenance: 2, status: 'maintenance', location: 'Site B', serialNumber: 'MP-2024-001', model: 'MP-800', workOrderNumber: 'WO-2024-003', partNumber: 'PN-80801', lastMaintenance: '2024-01-20', nextMaintenance: '2024-04-20', certificationExpiry: '2025-01-20' },
  { id: 'T004', name: 'Electrical Tester', sizeThread: 'N/A', material: 'Plastic/Metal', category: 'electrical', quantity: 20, available: 15, inUse: 3, maintenance: 2, status: 'available', location: 'Warehouse B', serialNumber: 'ET-2024-001', model: 'ET-200', workOrderNumber: 'WO-2024-004', partNumber: 'PN-20201', lastMaintenance: '2024-02-10', nextMaintenance: '2024-05-10', certificationExpiry: '2025-02-10' },
  { id: 'T005', name: 'Pressure Gauge', sizeThread: '2"', material: 'Stainless Steel', category: 'pressure', quantity: 30, available: 25, inUse: 3, maintenance: 2, status: 'available', location: 'Offshore Rig', serialNumber: 'PG-2024-001', model: 'PG-300', workOrderNumber: 'WO-2024-005', partNumber: 'PN-30301', lastMaintenance: '2024-01-25', nextMaintenance: '2024-04-25', certificationExpiry: '2025-01-25' },
  { id: 'T006', name: 'Casing Thread', sizeThread: '7"', material: 'Steel', category: 'drilling', quantity: 100, available: 80, inUse: 15, maintenance: 5, status: 'available', location: 'Warehouse A', serialNumber: 'CT-2024-001', model: 'CT-700', workOrderNumber: 'WO-2024-006', partNumber: 'PN-70701', lastMaintenance: '2024-02-05', nextMaintenance: '2024-05-05', certificationExpiry: '2025-02-05' },
  { id: 'T007', name: 'Flow Meter', sizeThread: '4"', material: 'Brass', category: 'pressure', quantity: 12, available: 8, inUse: 2, maintenance: 2, status: 'maintenance', location: 'Site A', serialNumber: 'FM-2024-001', model: 'FM-400', workOrderNumber: 'WO-2024-007', partNumber: 'PN-40401', lastMaintenance: '2024-01-30', nextMaintenance: '2024-04-30', certificationExpiry: '2025-01-30' },
  { id: 'T008', name: 'Fire Extinguisher', sizeThread: '10lb', material: 'Steel', category: 'safety', quantity: 40, available: 35, inUse: 3, maintenance: 2, status: 'available', location: 'Site B', serialNumber: 'FE-2024-001', model: 'FE-100', workOrderNumber: 'WO-2024-008', partNumber: 'PN-10101', lastMaintenance: '2024-02-15', nextMaintenance: '2024-05-15', certificationExpiry: '2025-02-15' },
  { id: 'T009', name: 'Generator', sizeThread: '50kW', material: 'Steel', category: 'electrical', quantity: 5, available: 2, inUse: 2, maintenance: 1, status: 'available', location: 'Offshore Rig', serialNumber: 'GN-2024-001', model: 'GN-500', workOrderNumber: 'WO-2024-009', partNumber: 'PN-50501', lastMaintenance: '2024-02-20', nextMaintenance: '2024-05-20', certificationExpiry: '2025-02-20' },
  { id: 'T010', name: 'Tubing Head', sizeThread: '5-1/2"', material: 'Steel', category: 'drilling', quantity: 25, available: 18, inUse: 5, maintenance: 2, status: 'available', location: 'Warehouse B', serialNumber: 'TH-2024-001', model: 'TH-550', workOrderNumber: 'WO-2024-010', partNumber: 'PN-55501', lastMaintenance: '2024-01-10', nextMaintenance: '2024-04-10', certificationExpiry: '2025-01-10' },
  { id: 'T011', name: 'Safety Harness', sizeThread: 'L', material: 'Nylon/Steel', category: 'safety', quantity: 35, available: 30, inUse: 3, maintenance: 2, status: 'available', location: 'Site A', serialNumber: 'SH-2024-002', model: 'SH-600', workOrderNumber: 'WO-2024-011', partNumber: 'PN-60101', lastMaintenance: '2024-02-08', nextMaintenance: '2024-05-08', certificationExpiry: '2025-02-08' },
  { id: 'T012', name: 'Valve Assembly', sizeThread: '6"', material: 'Steel', category: 'pressure', quantity: 18, available: 10, inUse: 5, maintenance: 3, status: 'maintenance', location: 'Site B', serialNumber: 'VA-2024-001', model: 'VA-600', workOrderNumber: 'WO-2024-012', partNumber: 'PN-60601', lastMaintenance: '2024-01-18', nextMaintenance: '2024-04-18', certificationExpiry: '2025-01-18' },
];

// ============================================
// Mock Activities
// ============================================

export const mockActivities: Activity[] = [
  { id: 'A001', type: 'checkout', description: 'Checked out Drill Bit 8.5" for Site A operation', user: 'John Smith', tool: 'Drill Bit 8.5"', timestamp: '2024-03-15T09:30:00', location: 'Site A' },
  { id: 'A002', type: 'maintenance', description: 'Completed maintenance on Mud Pump', user: 'Sarah Johnson', tool: 'Mud Pump', timestamp: '2024-03-15T08:15:00', location: 'Site B' },
  { id: 'A003', type: 'checkin', description: 'Returned Electrical Tester after inspection', user: 'Mike Wilson', tool: 'Electrical Tester', timestamp: '2024-03-14T16:45:00', location: 'Warehouse B' },
  { id: 'A004', type: 'added', description: 'Added new Safety Helmet inventory', user: 'Super Admin', tool: 'Safety Helmet', timestamp: '2024-03-14T14:00:00', location: 'Warehouse A' },
  { id: 'A005', type: 'damaged', description: 'Reported Pressure Gauge as damaged', user: 'Team Manager', tool: 'Pressure Gauge', timestamp: '2024-03-14T11:30:00', location: 'Offshore Rig' },
  { id: 'A006', type: 'transfer', description: 'Transferred 10 units of Casing Thread to Site B', user: 'Admin User', tool: 'Casing Thread', timestamp: '2024-03-13T15:20:00', location: 'Warehouse A → Site B' },
  { id: 'A007', type: 'checkout', description: 'Checked out Safety Harness for offshore work', user: 'Sarah Johnson', tool: 'Safety Harness', timestamp: '2024-03-13T10:00:00', location: 'Offshore Rig' },
  { id: 'A008', type: 'maintenance', description: 'Scheduled maintenance for Valve Assembly', user: 'HR Manager', tool: 'Valve Assembly', timestamp: '2024-03-12T14:30:00', location: 'Site B' },
];

// ============================================
// Mock Requests
// ============================================

export const mockRequests: Request[] = [
  { id: 'R001', type: 'tool_outgoing', status: 'pending', requester: 'Team Manager', tool: 'Drill Bit 8.5"', quantity: 5, reason: 'Required for new drilling operation at Site B', approver: 'Admin User', createdAt: '2024-03-15T10:00:00', updatedAt: '2024-03-15T10:00:00' },
  { id: 'R002', type: 'finance', status: 'pending', requester: 'Team Manager', reason: 'Water refill for Site A', amount: 500, approver: 'HR Manager', createdAt: '2024-03-14T09:00:00', updatedAt: '2024-03-14T09:00:00' },
  { id: 'R003', type: 'tool_incoming', status: 'approved', requester: 'Admin User', tool: 'Flow Meter', quantity: 3, reason: 'Replacement for damaged units', approver: 'Super Admin', createdAt: '2024-03-13T14:00:00', updatedAt: '2024-03-14T08:00:00' },
  { id: 'R004', type: 'tool_outgoing', status: 'rejected', requester: 'John Smith', tool: 'Generator', quantity: 2, reason: 'Emergency backup for offshore rig', approver: 'Admin User', createdAt: '2024-03-12T16:00:00', updatedAt: '2024-03-13T09:00:00' },
  { id: 'R005', type: 'finance', status: 'approved', requester: 'Sarah Johnson', reason: 'Equipment repair', amount: 2500, approver: 'HR Manager', createdAt: '2024-03-10T11:00:00', updatedAt: '2024-03-11T14:00:00' },
  { id: 'R006', type: 'tool_incoming', status: 'pending', requester: 'Team Manager', tool: 'Safety Harness', quantity: 20, reason: 'New safety equipment for incoming team', approver: 'HR Manager', createdAt: '2024-03-15T08:00:00', updatedAt: '2024-03-15T08:00:00' },
];

// ============================================
// Mock Meetings
// ============================================

export const mockMeetings: Meeting[] = [
  { id: 'M001', title: 'Safety Briefing', date: '2024-03-20', time: '08:00', endTime: '09:00', location: 'Site A - Main Hall', attendees: ['Super Admin', 'Admin User', 'Sarah Johnson'], organizer: 'Super Admin', status: 'upcoming', description: 'Weekly safety briefing for all personnel' },
  { id: 'M002', title: 'Tool Inventory Review', date: '2024-03-21', time: '10:00', endTime: '11:30', location: 'Warehouse A - Office', attendees: ['Team Manager', 'Admin User'], organizer: 'Admin User', status: 'upcoming', description: 'Monthly inventory check and audit planning' },
  { id: 'M003', title: 'Maintenance Planning', date: '2024-03-22', time: '14:00', endTime: '15:00', location: 'Site B - Conference Room', attendees: ['John Smith', 'Sarah Johnson', 'Team Manager'], organizer: 'Team Manager', status: 'upcoming', description: 'Quarterly maintenance scheduling' },
  { id: 'M004', title: 'Equipment Training', date: '2024-03-25', time: '09:00', endTime: '12:00', location: 'Training Center', attendees: ['Super Admin', 'HR Manager', 'All Staff'], organizer: 'HR Manager', status: 'upcoming', description: 'New equipment operation training' },
  { id: 'M005', title: 'Operations Sync', date: '2024-03-18', time: '13:00', endTime: '14:00', location: 'HQ - Meeting Room 1', attendees: ['Super Admin', 'Admin User', 'Team Manager'], organizer: 'Super Admin', status: 'completed', description: 'Weekly operations synchronization' },
];

// ============================================
// Mock Alerts
// ============================================

export const mockAlerts: Alert[] = [
  { id: 'AL001', type: 'critical', title: 'Maintenance Overdue', description: 'Mud Pump is 5 days overdue for scheduled maintenance', tool: 'Mud Pump', createdAt: '2024-03-15T08:00:00' },
  { id: 'AL002', type: 'warning', title: 'Certification Expiring', description: 'Drill Bit certification expires in 7 days', tool: 'Drill Bit 8.5"', createdAt: '2024-03-14T10:00:00' },
  { id: 'AL003', type: 'critical', title: 'Tool Missing', description: 'Flow Meter (SN: FM-2024-001) marked as lost', tool: 'Flow Meter', createdAt: '2024-03-13T15:00:00' },
  { id: 'AL004', type: 'warning', title: 'Overdue Return', description: 'Generator checked out 7 days ago not returned', tool: 'Generator', createdAt: '2024-03-12T12:00:00' },
  { id: 'AL005', type: 'info', title: 'Maintenance Scheduled', description: 'Valve Assembly scheduled for maintenance tomorrow', tool: 'Valve Assembly', createdAt: '2024-03-15T09:00:00' },
];

// ============================================
// Mock Maintenance Records
// ============================================

export const mockMaintenanceRecords: MaintenanceRecord[] = [
  { id: 'MR001', toolName: 'Mud Pump', type: 'scheduled', status: 'in_progress', startDate: '2024-03-15', endDate: '2024-03-20', technician: 'Mike Wilson', notes: 'Routine maintenance - pump inspection and seal replacement' },
  { id: 'MR002', toolName: 'Flow Meter', type: 'repair', status: 'pending', startDate: '2024-03-18', technician: 'John Smith', notes: 'Sensor calibration required' },
  { id: 'MR003', toolName: 'Valve Assembly', type: 'inspection', status: 'completed', startDate: '2024-03-10', endDate: '2024-03-12', technician: 'Sarah Johnson', notes: 'All valves inspected and working correctly' },
  { id: 'MR004', toolName: 'Generator', type: 'scheduled', status: 'pending', startDate: '2024-03-22', technician: 'Mike Wilson', notes: 'Annual generator service' },
  { id: 'MR005', toolName: 'Pressure Gauge', type: 'repair', status: 'completed', startDate: '2024-03-08', endDate: '2024-03-10', technician: 'Sarah Johnson', notes: 'Replaced faulty pressure sensor' },
];

// ============================================
// Dashboard Statistics
// ============================================

export const dashboardStats = {
  totalTools: 230,
  available: 189,
  inUse: 28,
  underMaintenance: 13,
  lostDamaged: 4,
  activeProjects: 12,
};

// ============================================
// Tool Categories Distribution
// ============================================

export const toolCategoryDistribution = [
  { name: 'Drilling', value: 35, color: '#0B3C6D' },
  { name: 'Safety', value: 25, color: '#00AEEF' },
  { name: 'Mechanical', value: 20, color: '#984307' },
  { name: 'Electrical', value: 12, color: '#1E6FBE' },
  { name: 'Pressure', value: 8, color: '#B86B2A' },
];

// ============================================
// Location Distribution
// ============================================

export const locationDistribution = [
  { name: 'Warehouse A', tools: 85 },
  { name: 'Warehouse B', tools: 45 },
  { name: 'Site A', tools: 50 },
  { name: 'Site B', tools: 30 },
  { name: 'Offshore Rig', tools: 20 },
];

// ============================================
// Usage Analytics
// ============================================

export const usageAnalytics = {
  mostUsedTools: [
    { name: 'Drill Bit 8.5"', uses: 156 },
    { name: 'Safety Helmet', uses: 142 },
    { name: 'Pressure Gauge', uses: 98 },
    { name: 'Electrical Tester', uses: 87 },
    { name: 'Mud Pump', uses: 76 },
  ],
  leastUsedTools: [
    { name: 'Generator', uses: 12 },
    { name: 'Valve Assembly', uses: 18 },
    { name: 'Flow Meter', uses: 24 },
  ],
  utilizationRate: 78,
  averageDowntime: 2.5,
};
