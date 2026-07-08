import { z } from 'zod';

// ============================================
// Helper: parse body with schema, return 400-friendly error
// ============================================
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
      : 'Invalid request body';
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}

// ============================================
// Auth
// ============================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(255),
});

// ============================================
// Tools
// ============================================
export const createToolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  work_order_number: z.string().max(100).optional().default(''),
  size_thread: z.string().max(50).optional(),
  material: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  material_no: z.string().max(100).optional(),
  part_number: z.string().max(100).optional(),
  category: z.string().max(100).optional().default('Saleable'),
  quantity: z.number().int().min(0, 'Quantity must be >= 0').optional(),
  min_quantity: z.number().int().min(0).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'rentals', 'sold']).optional().default('available'),
  location: z.string().max(200).optional(),
  image_url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  purchase_date: z.string().max(20).optional(),
  purchase_price: z.number().min(0).optional(),
  created_by: z.string().optional(),
  received_from: z.string().max(200).optional(),
  received_by: z.string().max(200).optional(),
  vehicle_number: z.string().max(100).optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;

export const updateToolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  work_order_number: z.string().max(100).optional(),
  size_thread: z.string().max(50).optional(),
  material: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  material_no: z.string().max(100).optional(),
  part_number: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0).optional(),
  min_quantity: z.number().int().min(0).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'rentals', 'sold']).optional(),
  location: z.string().max(200).optional(),
  image_url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  purchase_date: z.string().max(20).optional(),
  purchase_price: z.number().min(0).optional(),
  received_from: z.string().max(200).optional(),
  received_by: z.string().max(200).optional(),
  vehicle_number: z.string().max(100).optional(),
});

// ============================================
// Tool Requests
// ============================================
export const createToolRequestSchema = z.object({
  tool_id: z.string().optional().default(''),
  movement_type: z.enum(['incoming', 'outgoing']),
  transaction_type: z.enum(['sold', 'rented']).optional(),
  requested_by: z.string().optional(),
  assigned_to: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be >= 1').optional().default(1),
  notes: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  vehicle_no: z.string().max(100).optional(),
  delivered_to: z.string().max(200).optional(),
  delivered_by: z.string().max(200).optional(),
  received_by: z.string().max(200).optional(),
  received_from: z.string().max(200).optional(),
  new_tool_data: z.record(z.string(), z.unknown()).optional(),
});

export type CreateToolRequestInput = z.infer<typeof createToolRequestSchema>;

export const updateToolRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  approved_by: z.string().optional(),
});

// ============================================
// Financial Requests
// ============================================
export const createFinancialRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  amount: z.number().positive('Amount must be > 0'),
  category: z.string().min(1, 'Category is required').max(100),
  requested_by: z.string().optional(),
});

export type CreateFinancialRequestInput = z.infer<typeof createFinancialRequestSchema>;

export const updateFinancialRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  approved_by: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// Maintenance
// ============================================
export const createMaintenanceSchema = z.object({
  tool_id: z.string().min(1, 'Tool ID is required'),
  maintenance_type: z.enum(['inspection', 'repair', 'calibration', 'replacement', 'cleaning', 'other']),
  description: z.string().min(1, 'Description is required').max(2000),
  scheduled_date: z.string().min(1, 'Scheduled date is required').max(30),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const updateMaintenanceSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  performed_by: z.string().optional(),
});
