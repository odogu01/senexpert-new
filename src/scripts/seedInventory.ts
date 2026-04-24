/**
 * Seed script to add tools from Google Sheet to the inventory
 * Run: npx tsx src/scripts/seedInventory.ts
 */

const API_URL = 'http://localhost:3000';

const toolsData = [
  { name: 'SLIDING SLEEVE DOOR', size_thread: '3-1/2 Vamtop Box X PIN', material: 'Chrome', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '4-1/2 Vamtop Box X PIN', material: 'Chrome', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '4-1/2 Vamtop Box X PIN', material: 'L-80', quantity: 2, model: 'ADDAX', work_order_number: '2' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '4-1/2 HCS Box x PIN', material: 'Chrome', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '4-1/2 Vamtop Box X PIN', material: 'L-80', quantity: 3, model: 'Baker', work_order_number: '3' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '3-1/2 HCS BOX X PIN', material: 'Chrome', quantity: 6, model: 'OTIS', work_order_number: '6' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '3-1/2 HCS BOX X PIN', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '2-7/8 HCS BOX X PIN', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '2-3/8 HCS BOX X PIN', material: 'Chrome', quantity: 7, model: 'OTIS', work_order_number: '7' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '2-7/8 NU PIN X PIN', material: 'Chrome', quantity: 2, model: 'BKR', work_order_number: '2' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '2-3/8" HYDRIL 511 BOX', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SLIDING SLEEVE DOOR', size_thread: '2-3/8 NUE PIN X PIN', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SEAL BORE EXTENSION', size_thread: '80-40 Stub Acme PIN X Blank (5ft)', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SEAL BORE EXTENSION', size_thread: '80-40 Blank x Blank (4ft)', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SEAL BORE EXTENSION', size_thread: '4" Vamtop Box X Pin (3ft)', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SEAL BORE EXTENSION', size_thread: '4-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'SEAL BORE EXTENSION', size_thread: '7-5/8 BTC Box X Pin', material: 'L-80', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'SEAL BORE EXTENSION', size_thread: '6.625 Vamtop', material: 'Chrome', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'MILL OUT EXT WITH CROSS OVER SUB', size_thread: '7" Seal Lock hulting Box X 511/2 Seal lock hutting PIN', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'MILL OUT EXTENSION', size_thread: '7" BTC BOX X PIN', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'MILL OUT EXTENSION', size_thread: '7" BTC PIN X PIN', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'MILL OUT EXTENSION', size_thread: '7" LTC PIN X PIN', material: 'L-80', quantity: 4, model: 'OTIS', work_order_number: '2' },
  { name: 'MILL OUT EXTENSION (with xover sub)', size_thread: '7" BTC BOX X PIN', material: 'L-80', quantity: 3, model: 'OTIS', work_order_number: '2' },
  { name: 'Mill Out Extention With Half Mule Shoe', size_thread: '7-5/8 STC PIN X Half Mule', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '4-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 3, model: 'CAMCO', work_order_number: '3' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '2-7/8 Blank X Blank', material: 'L-80', quantity: 11, model: 'Weatherford', work_order_number: '11' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '2-3/8 Blank x Blank', material: 'L-80', quantity: 10, model: 'Weatherford', work_order_number: '5' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '4-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 10, model: 'Weatherford', work_order_number: '10' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '3-1/2 HCS Box X Pin', material: 'L-80', quantity: 1, model: 'CAMCO', work_order_number: '1' },
  { name: 'GAS LIFT MANDREL (GLM)', size_thread: '3-1/2 HCS Box X Pin', material: 'L-80', quantity: 3, model: 'Weatherford', work_order_number: '3' },
  { name: 'FLOW COUPLING', size_thread: '3-1/2 HCS BOX X PIN (10ft)', material: 'Chrome', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'FLOW COUPLING', size_thread: '4-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'FLOW COUPLING', size_thread: '4-1/2 HCS Box X Pin', material: 'L-80', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'FLOW COUPLING', size_thread: '5-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 29, model: 'OTIS', work_order_number: '29' },
  { name: 'FLOW COUPLING', size_thread: '3-1/2 HCS Box X NUE Pin', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'FLOW COUPLING', size_thread: '3-1/2 EUE Box X Pin', material: 'L-80', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'FLOW COUPLING', size_thread: '3-1/2 NUE Box X Box', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'FLOW COUPLING', size_thread: '2-7/8 EUE Box X Pin', material: 'L-80', quantity: 8, model: 'OTIS', work_order_number: '8' },
  { name: 'FLOW COUPLING', size_thread: '2-7/8 HCS Box X Pin', material: 'L-80', quantity: 27, model: 'OTIS', work_order_number: '27' },
  { name: 'FLOW COUPLING', size_thread: '2-7/8 VamFJL BOX X Pin', material: 'Chrome', quantity: 8, model: 'OTIS', work_order_number: '6' },
  { name: 'FLOW COUPLING', size_thread: '2-7/8 HCS Box X Pin', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'LIFT SUB (LIFT NIPPLE)', size_thread: '4-1/2 BTC', material: 'L-80', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'LIFT SUB (LIFT NIPPLE)', size_thread: '2-3/8 HCS', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'DOWN HOLE GAUGE MANDREL', size_thread: '3-1/2 HCS Box X Pin', material: 'Chrome', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'SEAL BORE PACKER (SC2R)', size_thread: '7" Seal Lock Hunting', material: 'L-80', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SEAL BORE PACKER (SC2R)', size_thread: '7" Stub Acme', material: 'Chrome', quantity: 2, model: 'BKR', work_order_number: '2' },
  { name: 'SEAL BORE PACKER (SC2R)', size_thread: '9-5/8 Stub Acme (SC2R)', material: 'Chrome', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SEAL BORE PACKER (SC2R)', size_thread: '7"', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SEAL BORE PERMANENT PACKER', size_thread: '7" Vamtop', material: 'L-80', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SEAL BORE PERMANENT PACKER', size_thread: '7" LTC Box', material: 'L-80', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SEAL BORE PERMANENT PACKER', size_thread: '9-5/8', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SINGLE STRING PACKER (HYDRIL C)', size_thread: '9-5/8 x 3-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 2, model: 'Weatherford', work_order_number: '2' },
  { name: 'SINGLE STRING PACKER (HYDRIL C)', size_thread: '9-5/8 X 3-1/2 Vamtop Box X Pin', material: 'Chrome', quantity: 4, model: 'Weatherford', work_order_number: '4' },
  { name: 'HYDRAULIC SET PACKER', size_thread: '9-5/8 X 3-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 2, model: 'Weatherford', work_order_number: '2' },
  { name: 'SINGLE STRING PACKER (HYDRIL C)', size_thread: '7"X 3-1/2 Vamtop Box X Pin', material: 'L-80', quantity: 4, model: 'Weatherford', work_order_number: '4' },
  { name: 'AXH PACKER', size_thread: '7"X 4-1/2 Vamtop Box X Pin', material: 'Chrome', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'DUAL STRING PACKER', size_thread: '9-5/8 HCS BOX X PIN', material: 'L-80', quantity: 1, model: 'Weatherford', work_order_number: '1' },
  { name: 'DUAL STRING PACKER', size_thread: '7" x 2-3/8 Vamtop Box X Pin', material: 'Chrome', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'DUAL STRING PACKER', size_thread: '9-5/8" x 3-1/2 Vamtop Box X Pin', material: 'Chrome', quantity: 2, model: 'Halliburton', work_order_number: '2' },
  { name: 'SHEAR OUT SAFETY JOINT', size_thread: '5" Seal lock hunting Box X Pin', material: 'L-80', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SHEAR OUT SAFETY JOINT', size_thread: '5" Seal Lock hunting Box X Pin', material: 'Chrome', quantity: 1, model: 'BKR', work_order_number: '1' },
  { name: 'SNAP LATCH', size_thread: '190-47 EU Box', material: 'Chrome', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'SNAP LATCH', size_thread: '190-47 EU Box', material: 'L-80', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'SNAP LATCH', size_thread: '190-60 Vamtop Box X Stub Acme Pin', material: 'Chrome', quantity: 2, model: 'SLB', work_order_number: '2' },
  { name: 'SNAP LATCH', size_thread: '190- 60 EU Box', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SNAP LATCH', size_thread: '190-60 EU Box', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'PUP JOINT', size_thread: '10ft HCS Box X Pin', material: 'Chrome', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'PUP JOINT', size_thread: '10ft HCS Box X Pin (3-1/2)', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'PUP JOINT', size_thread: '(2ft)HCS Box X Pin 3-1/2', material: 'Chrome', quantity: 10, model: 'OTIS', work_order_number: '1' },
  { name: 'PUP JOINT', size_thread: '(2ft)HCS Box X Pin2-7/8', material: 'L-80', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'PUP JOINT', size_thread: '4ft HCS Box X Pin', material: 'Chrome', quantity: 14, model: 'OTIS', work_order_number: '1' },
  { name: 'PUP JOINT', size_thread: '4ft HCS Box X Pin', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'PUP JOINT', size_thread: '6ft HCS Box X Pin', material: 'L-80', quantity: 3, model: 'OTIS', work_order_number: '3' },
  { name: 'PUP JOINT', size_thread: '10ft HCS Box X Pin', material: 'Chrome', quantity: 10, model: 'OTIS', work_order_number: '10' },
  { name: 'PUP JOINT', size_thread: '8ft HCS Box X Pin', material: 'Chrome', quantity: 8, model: 'OTIS', work_order_number: '8' },
  { name: 'PUP JOINT', size_thread: '6ft HCS Box X Pin', material: 'Chrome', quantity: 9, model: 'OTIS', work_order_number: '9' },
  { name: 'PUP JOINT', size_thread: '3ft HCS Box X Pin', material: 'Chrome', quantity: 12, model: 'OTIS', work_order_number: '12' },
  { name: 'PUP JOINT', size_thread: '2ft HCS Box X Pin', material: 'Chrome', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'SSV SUB ASSEMBLY', size_thread: '3-1/2 HCS Box X Pin', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SUB SAFETY VALVE', size_thread: '2-3/8 CS Box X Pin', material: 'Chrome', quantity: 4, model: 'OTIS', work_order_number: '4' },
  { name: 'SUB SAFETY VALVE', size_thread: '3-1/2 CS Box X Pin', material: 'Chrome', quantity: 2, model: 'OTIS', work_order_number: '2' },
  { name: 'SUB SAFETY VALVE', size_thread: '4-1/2 CS Box X Pin', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'SUB SAFETY VALVE', size_thread: '2-7/8 HCS Box X Pin', material: 'Chrome', quantity: 1, model: 'OTIS', work_order_number: '1' },
  { name: 'BRIDGE PLUG', size_thread: '7" Stub Acme Box', material: 'L-80', quantity: 5, model: 'BKR', work_order_number: '5' },
  { name: 'BULL NOSE', size_thread: '6-5/8 Vamtop Box', material: 'L-80', quantity: 1, model: 'OTIS', work_order_number: '1' },
];

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@test.com',
      password: 'Test@123',
    }),
  });
  
  const data = await response.json();
  if (data.success && data.data) {
    return data.data.token;
  }
  throw new Error('Login failed');
}

async function createTool(token: string, tool: any) {
  const response = await fetch(`${API_URL}/api/tools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tool),
  });
  
  return response.json();
}

async function seed() {
  console.log('Logging in...');
  const token = await login();
  console.log('Logged in successfully!');
  
  console.log(`Adding ${toolsData.length} tools to inventory...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const tool of toolsData) {
    const result = await createTool(token, {
      ...tool,
      category: 'Saleable',
      status: 'available',
      min_quantity: 1,
    });
    
    if (result.success) {
      successCount++;
      console.log(`✓ Added: ${tool.name} (${tool.size_thread}) - Qty: ${tool.quantity}`);
    } else {
      errorCount++;
      console.log(`✗ Failed: ${tool.name} - ${result.error}`);
    }
  }
  
  console.log(`\n=== Seed Complete ===`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${toolsData.length}`);
}

seed().catch(console.error);