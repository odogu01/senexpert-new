// @ts-nocheck
/** Consolidate repeated part-number stock records only when every tool detail matches. */
import { connectToDatabase, getClient, getDatabase } from '@/lib/mongodb';

const normalizeMaterial = (material: unknown) => {
  if (typeof material !== 'string') return material || '';
  if (material.toUpperCase() === 'L-80') return 'L80';
  if (material.toUpperCase() === 'CR-L80') return 'CHROME';
  return material;
};

const identity = (tool: any) => JSON.stringify([
  tool.name || '', tool.size_thread || '', normalizeMaterial(tool.material), tool.model || '',
  tool.material_no || '', tool.part_number || '', tool.category || '', tool.status || '',
  tool.location || '', tool.description || '', tool.image_url || '', tool.purchase_date || '',
  Number(tool.purchase_price || 0),
]);

async function main() {
  const apply = process.argv.includes('--apply');
  await connectToDatabase();
  const db = getDatabase();
  const tools = await db.collection('tools').find({}).toArray();
  const groups = new Map<string, any[]>();
  for (const tool of tools) {
    const partNumber = String(tool.part_number || '').trim();
    if (!partNumber || partNumber.toUpperCase() === 'N/A' || Number(tool.quantity || 0) <= 0) continue;
    const groupKey = `${partNumber}\u0000${identity(tool)}`;
    groups.set(groupKey, [...(groups.get(groupKey) || []), tool]);
  }

  const mergePlans = [] as any[];
  const skippedDuplicateWos = [] as any[];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const workOrders = group.flatMap(tool => Array.isArray(tool.work_order_numbers)
      ? tool.work_order_numbers
      : tool.work_order_number ? [tool.work_order_number] : []).map((value: string) => String(value).trim()).filter(Boolean);
    if (new Set(workOrders).size !== workOrders.length) {
      skippedDuplicateWos.push({
        part_number: group[0].part_number,
        tools: group.map(tool => ({
          name: tool.name,
          quantity: Number(tool.quantity || 0),
          work_order_numbers: Array.isArray(tool.work_order_numbers) ? tool.work_order_numbers : (tool.work_order_number ? [tool.work_order_number] : []),
        })),
      });
      continue;
    }
    const quantity = group.reduce((sum, tool) => sum + Number(tool.quantity || 0), 0);
    const initialQuantity = group.reduce((sum, tool) => sum + Number(tool.initial_quantity ?? tool.quantity ?? 0), 0);
    mergePlans.push({
      survivor: group[0], duplicates: group.slice(1), workOrders, quantity, initialQuantity,
    });
  }

  const partGroups = new Map<string, Set<string>>();
  for (const tool of tools) {
    const pn = String(tool.part_number || '').trim();
    if (!pn || pn.toUpperCase() === 'N/A' || Number(tool.quantity || 0) <= 0) continue;
    const variants = partGroups.get(pn) || new Set<string>();
    variants.add(identity(tool));
    partGroups.set(pn, variants);
  }
  const variantPartNumbers = [...partGroups.entries()].filter(([, variants]) => variants.size > 1).map(([part_number]) => part_number);

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    active_tools: tools.filter(tool => Number(tool.quantity || 0) > 0).length,
    exact_duplicate_groups: mergePlans.length,
    documents_to_hide_after_merge: mergePlans.reduce((sum, plan) => sum + plan.duplicates.length, 0),
    documents_with_variant_details_kept_separate: variantPartNumbers.length,
    groups_skipped_due_to_duplicate_work_order_values: skippedDuplicateWos,
    planned_merges: process.argv.includes('--verbose') ? mergePlans.map(plan => ({ part_number: plan.survivor.part_number, tool_name: plan.survivor.name, quantity: plan.quantity, work_order_numbers: plan.workOrders })) : undefined,
  }, null, 2));

  const client = getClient();
  if (!apply) {
    await client.close();
    return;
  }
  try {
  await client.withSession(async session => session.withTransaction(async () => {
    const now = new Date();
    const toolOps = [] as any[];
    const auditEntries = [] as any[];
    const survivorIds = new Set(mergePlans.map(plan => plan.survivor._id.toString()));
    for (const plan of mergePlans) {
      toolOps.push({ updateOne: { filter: { _id: plan.survivor._id }, update: { $set: {
          quantity: plan.quantity,
          initial_quantity: plan.initialQuantity,
          work_order_number: '',
          work_order_numbers: plan.workOrders,
          material: normalizeMaterial(plan.survivor.material),
          updated_at: now,
        } } } });
      auditEntries.push({
        action: 'UPDATE', table_name: 'tools', record_id: plan.survivor._id.toString(),
        old_values: { quantity: plan.survivor.quantity, work_order_number: plan.survivor.work_order_number, work_order_numbers: plan.survivor.work_order_numbers },
        new_values: { quantity: plan.quantity, work_order_number: '', work_order_numbers: plan.workOrders }, created_at: now, updated_at: now,
      });
      for (const duplicate of plan.duplicates) {
        toolOps.push({ updateOne: { filter: { _id: duplicate._id, quantity: { $gt: 0 } }, update: { $set: { quantity: 0, merged_into: plan.survivor._id.toString(), merged_at: now, updated_at: now } } } });
        auditEntries.push({
          action: 'UPDATE', table_name: 'tools', record_id: duplicate._id.toString(),
          old_values: { quantity: duplicate.quantity, work_order_number: duplicate.work_order_number, work_order_numbers: duplicate.work_order_numbers },
          new_values: { quantity: 0, merged_into: plan.survivor._id.toString() }, created_at: now, updated_at: now,
        });
      }
    }
    for (const tool of tools) {
      if (survivorIds.has(tool._id.toString())) continue;
      const updates: Record<string, unknown> = {};
      if (typeof tool.material === 'string' && ['L-80', 'CR-L80'].includes(tool.material.toUpperCase())) updates.material = normalizeMaterial(tool.material);
      if (typeof tool.work_order_number === 'string' && tool.work_order_number.trim() && !Array.isArray(tool.work_order_numbers)) {
        updates.work_order_numbers = [tool.work_order_number.trim()];
        updates.work_order_number = '';
      }
      if (!Object.keys(updates).length) continue;
      updates.updated_at = now;
      toolOps.push({ updateOne: { filter: { _id: tool._id }, update: { $set: updates } } });
      auditEntries.push({
        action: 'UPDATE', table_name: 'tools', record_id: tool._id.toString(),
        old_values: { material: tool.material, work_order_number: tool.work_order_number, work_order_numbers: tool.work_order_numbers },
        new_values: updates, created_at: now, updated_at: now,
      });
    }
    if (toolOps.length) await db.collection('tools').bulkWrite(toolOps, { session, ordered: true });
    if (auditEntries.length) await db.collection('audit_logs').insertMany(auditEntries, { session, ordered: true });
    console.log(`Applying ${toolOps.length} inventory updates and ${auditEntries.length} audit records.`);
  }));
  console.log('Inventory migration applied successfully.');
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error('Inventory migration failed:', error);
  process.exitCode = 1;
});
