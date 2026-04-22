/**
 * Comprehensive Seed Script - Populate all MongoDB collections
 * Run with: npx tsx -r dotenv/config src/scripts/seedAll.ts
 */

require('dotenv').config();
const { connectToDatabase, getCollection } = require('../lib/mongodb');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

interface SeedTool {
  name: string;
  work_order_number: string;
  size_thread?: string;
  material?: string;
  model?: string;
  part_number?: string;
  category: string;
  quantity: number;
  min_quantity: number;
  status: string;
  location?: string;
  description?: string;
  purchase_date?: string;
  purchase_price?: number;
}

interface SeedToolRequest {
  tool_id: string;
  movement_type: 'incoming' | 'outgoing';
  requested_by: string;
  quantity: number;
  status: string;
  notes?: string;
}

interface SeedMaintenance {
  tool_id: string;
  maintenance_type: string;
  description: string;
  status: string;
  scheduled_date: string;
  cost?: number;
}

interface SeedAlert {
  title: string;
  description?: string;
  type: string;
  category?: string;
}

interface SeedFinancialRequest {
  title: string;
  description: string;
  amount: number;
  category: string;
  requested_by: string;
  status: string;
}

const seedTools: SeedTool[] = [
  { name: 'Casing Tubing', work_order_number: 'WO-001', size_thread: '7"', material: 'Steel', model: 'CT-7000', part_number: 'PT-001', category: 'Casing', quantity: 150, min_quantity: 50, status: 'available', location: 'Warehouse A', description: 'High-grade casing tubing for oil wells' },
  { name: 'Drill Pipe', work_order_number: 'WO-002', size_thread: '5"', material: 'Steel', model: 'DP-5000', part_number: 'PT-002', category: 'Drilling', quantity: 80, min_quantity: 30, status: 'available', location: 'Warehouse A', description: 'Premium drill pipe for deep drilling' },
  { name: 'Wellhead Equipment', work_order_number: 'WO-003', size_thread: '18-3/4"', material: 'Carbon Steel', model: 'WHE-1800', part_number: 'PT-003', category: 'Wellhead', quantity: 12, min_quantity: 5, status: 'available', location: 'Yard B', description: 'Wellhead assembly equipment' },
  { name: 'Christmas Tree', work_order_number: 'WO-004', size_thread: '13-5/8"', material: 'Stainless Steel', model: 'CT-1300', part_number: 'PT-004', category: 'Wellhead', quantity: 8, min_quantity: 3, status: 'in_use', location: 'Site Alpha', description: 'Surface christmas tree assembly' },
  { name: 'Tubing String', work_order_number: 'WO-005', size_thread: '2-7/8"', material: 'Steel', model: 'TS-2800', part_number: 'PT-005', category: 'Tubing', quantity: 200, min_quantity: 75, status: 'available', location: 'Warehouse A', description: 'Production tubing string' },
  { name: 'Safety Valve', work_order_number: 'WO-006', size_thread: '3-1/2"', material: 'Alloy', model: 'SV-3500', part_number: 'PT-006', category: 'Safety', quantity: 25, min_quantity: 10, status: 'maintenance', location: 'Workshop', description: 'Subsurface safety valve' },
  { name: 'Wireline Equipment', work_order_number: 'WO-007', material: 'Steel', model: 'WL-2000', part_number: 'PT-007', category: 'Wireline', quantity: 15, min_quantity: 5, status: 'available', location: 'Warehouse B', description: 'Electric line logging equipment' },
  { name: 'Pump Assembly', work_order_number: 'WO-008', material: 'Iron', model: 'PA-5000', part_number: 'PT-008', category: 'Pumping', quantity: 6, min_quantity: 3, status: 'in_use', location: 'Site Beta', description: 'ESP pump assembly' },
  { name: 'Flow Control', work_order_number: 'WO-009', size_thread: '4-1/2"', material: 'Steel', model: 'FC-4500', part_number: 'PT-009', category: 'Control', quantity: 45, min_quantity: 15, status: 'available', location: 'Warehouse A', description: 'Flow control valves' },
  { name: 'Completion Tools', work_order_number: 'WO-010', material: 'Various', model: 'CT-100', part_number: 'PT-010', category: 'Completion', quantity: 100, min_quantity: 40, status: 'available', location: 'Warehouse C', description: 'Various completion tools' },
  { name: 'Sanding Equipment', work_order_number: 'WO-011', material: 'Steel', model: 'SE-3000', part_number: 'PT-011', category: 'Sand Control', quantity: 30, min_quantity: 10, status: 'available', location: 'Warehouse B', description: 'Sand screen filtration' },
  { name: 'Intervention Tools', work_order_number: 'WO-012', material: 'Steel', model: 'IT-1500', part_number: 'PT-012', category: 'Intervention', quantity: 20, min_quantity: 8, status: 'in_use', location: 'Site Gamma', description: 'Well intervention tools' },
];

const seedToolRequests: SeedToolRequest[] = [
  { tool_id: '', movement_type: 'outgoing', requested_by: '', quantity: 20, status: 'pending', notes: 'Urgent request for Site Alpha' },
  { tool_id: '', movement_type: 'outgoing', requested_by: '', quantity: 10, status: 'pending', notes: 'Routine maintenance request' },
  { tool_id: '', movement_type: 'incoming', requested_by: '', quantity: 50, status: 'approved', notes: 'Restocking from supplier' },
  { tool_id: '', movement_type: 'outgoing', requested_by: '', quantity: 5, status: 'completed', notes: 'Completed project return' },
];

const seedMaintenance: SeedMaintenance[] = [
  { tool_id: '', maintenance_type: 'inspection', description: 'Quarterly inspection of safety valves', status: 'scheduled', scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), cost: 500 },
  { tool_id: '', maintenance_type: 'repair', description: 'Repair damaged pump assembly', status: 'in_progress', scheduled_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), cost: 2500 },
  { tool_id: '', maintenance_type: 'calibration', description: 'Calibrate wireline equipment', status: 'scheduled', scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), cost: 800 },
  { tool_id: '', maintenance_type: 'replacement', description: 'Replace worn components', status: 'completed', scheduled_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), cost: 1200 },
  { tool_id: '', maintenance_type: 'cleaning', description: 'Deep cleaning of Christmas trees', status: 'scheduled', scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), cost: 300 },
];

const seedAlerts: SeedAlert[] = [
  { title: 'Low Stock Alert', description: 'Safety valve inventory below minimum threshold', type: 'warning', category: 'Inventory' },
  { title: 'Maintenance Due', description: 'Pump assembly maintenance overdue', type: 'critical', category: 'Maintenance' },
  { title: 'New Tool Request', description: 'New tool request awaiting approval', type: 'info', category: 'Requests' },
  { title: 'Equipment Returned', description: 'Intervention tools returned from Site Gamma', type: 'success', category: 'Inventory' },
  { title: 'Low Stock Alert', description: 'Flow control valves running low', type: 'warning', category: 'Inventory' },
];

const seedFinancialRequests: SeedFinancialRequest[] = [
  { title: 'Emergency Equipment Purchase', description: 'Urgent need for replacement pump assembly', amount: 15000, category: 'Equipment', requested_by: '', status: 'pending' },
  { title: 'Routine Maintenance Budget', description: 'Q2 maintenance and inspection services', amount: 8500, category: 'Maintenance', requested_by: '', status: 'pending' },
  { title: 'Safety Equipment Upgrade', description: 'Upgrade safety valves to latest standards', amount: 22000, category: 'Safety', requested_by: '', status: 'approved' },
  { title: 'Training Program', description: 'Staff certification and training', amount: 5000, category: 'Training', requested_by: '', status: 'rejected' },
  { title: 'Warehouse Supplies', description: 'Office and warehouse consumables', amount: 2500, category: 'Operations', requested_by: '', status: 'approved' },
];

async function seed() {
  console.log('🌱 Starting comprehensive seed process...\n');

  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Get collections
    const toolsCollection = getCollection('tools');
    const toolRequestsCollection = getCollection('tool_requests');
    const maintenanceCollection = getCollection('maintenance');
    const alertsCollection = getCollection('alerts');
    const financialRequestsCollection = getCollection('financial_requests');
    const profilesCollection = getCollection('profiles');

    // Get a test user for relationships
    const testUser = await profilesCollection.findOne({ role: 'super_admin' });
    const testUserId = testUser?._id?.toString() || '507f1f77bcf86cd799439011';

    // 1. Seed Tools
    console.log('📦 Seeding tools...');
    for (const toolData of seedTools) {
      const existingTool = await toolsCollection.findOne({ work_order_number: toolData.work_order_number });
      if (existingTool) {
        console.log(`  ⚠️  Tool ${toolData.name} already exists, skipping...`);
        continue;
      }

      const tool = {
        _id: new ObjectId(),
        ...toolData,
        created_by: testUserId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await toolsCollection.insertOne(tool);
      console.log(`  ✅ Created tool: ${tool.name}`);
    }

    // Get tool IDs for relationships
    const tools = await toolsCollection.find({}).toArray();
    const toolIds = tools.map(t => t._id.toString());

    // 2. Seed Tool Requests
    console.log('\n📋 Seeding tool requests...');
    for (let i = 0; i < seedToolRequests.length; i++) {
      const reqData = seedToolRequests[i];
      
      const request = {
        _id: new ObjectId(),
        tool_id: toolIds[i % toolIds.length] || '',
        movement_type: reqData.movement_type,
        requested_by: testUserId,
        assigned_to: null,
        quantity: reqData.quantity,
        status: reqData.status,
        notes: reqData.notes,
        request_date: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await toolRequestsCollection.insertOne(request);
      console.log(`  ✅ Created tool request: ${reqData.movement_type} - ${reqData.quantity} units`);
    }

    // 3. Seed Maintenance Records
    console.log('\n🔧 Seeding maintenance records...');
    for (let i = 0; i < seedMaintenance.length; i++) {
      const maintData = seedMaintenance[i];
      
      const maintenance = {
        _id: new ObjectId(),
        tool_id: toolIds[i % toolIds.length] || '',
        maintenance_type: maintData.maintenance_type,
        description: maintData.description,
        status: maintData.status,
        scheduled_date: maintData.scheduled_date,
        cost: maintData.cost,
        performed_by: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await maintenanceCollection.insertOne(maintenance);
      console.log(`  ✅ Created maintenance: ${maintData.maintenance_type} for tool`);
    }

    // 4. Seed Alerts
    console.log('\n🔔 Seeding alerts...');
    for (const alertData of seedAlerts) {
      const alert = {
        _id: new ObjectId(),
        title: alertData.title,
        description: alertData.description,
        type: alertData.type,
        category: alertData.category,
        tool_id: null,
        is_read: false,
        created_by: testUserId,
        created_at: new Date(),
      };

      await alertsCollection.insertOne(alert);
      console.log(`  ✅ Created alert: ${alert.title}`);
    }

    // 5. Seed Financial Requests
    console.log('\n💰 Seeding financial requests...');
    for (const finData of seedFinancialRequests) {
      const financialRequest = {
        _id: new ObjectId(),
        title: finData.title,
        description: finData.description,
        amount: finData.amount,
        category: finData.category,
        requested_by: testUserId,
        approved_by: finData.status === 'approved' ? testUserId : null,
        approved_at: finData.status === 'approved' ? new Date() : null,
        status: finData.status,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await financialRequestsCollection.insertOne(financialRequest);
      console.log(`  ✅ Created financial request: ${finData.title} - $${finData.amount}`);
    }

    console.log('\n✅✅✅ Seed completed successfully! ✅✅✅');
    console.log('\n📊 Summary:');
    console.log(`   - Tools: ${await toolsCollection.countDocuments()}`);
    console.log(`   - Tool Requests: ${await toolRequestsCollection.countDocuments()}`);
    console.log(`   - Maintenance: ${await maintenanceCollection.countDocuments()}`);
    console.log(`   - Alerts: ${await alertsCollection.countDocuments()}`);
    console.log(`   - Financial Requests: ${await financialRequestsCollection.countDocuments()}`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();