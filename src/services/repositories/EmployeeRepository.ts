// @ts-nocheck
import { BaseRepository } from './BaseRepository';

function positionSlots(category: string) {
  if (category === 'MD/CEO') return ['MD/CEO'];
  if (category === 'C.O.O') return ['C.O.O-1', 'C.O.O-2'];
  return [];
}

function positionLimitError(category: string) {
  const error: any = new Error(category === 'MD/CEO'
    ? 'The MD/CEO position is already assigned to another employee.'
    : 'Both C.O.O positions are already assigned to employees.');
  error.code = 'EMPLOYEE_POSITION_LIMIT';
  return error;
}

export class EmployeeRepository extends BaseRepository<any> {
  constructor() { super('employees'); }

  async ensureIndexes() {
    const collection = await this.getCollection();
    await collection.createIndex({ employee_id: 1 }, { unique: true, name: 'idx_employees_employee_id' });
    await collection.createIndex({ employment_status: 1, department: 1 }, { name: 'idx_employees_status_department' });
    await collection.createIndex({ official_email: 1 }, { unique: true, sparse: true, name: 'idx_employees_official_email' });
    await collection.createIndex({ executive_slot: 1 }, {
      unique: true,
      name: 'idx_employees_executive_slot',
      partialFilterExpression: { executive_slot: { $type: 'string' } },
    });
  }

  async nextSequence(): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: 'employee_id' },
      { $inc: { sequence: 1 }, $setOnInsert: { created_at: new Date() } },
      { upsert: true, returnDocument: 'after' },
    );
    return result.sequence;
  }

  async list({ search = '', department = '', category = '', status = '', page = 1, pageSize = 25 } = {}) {
    const collection = await this.getCollection();
    const query: Record<string, any> = {};
    // The sequence counter is stored in this collection as a document with a
    // string _id. It is infrastructure, not an employee record.
    query._id = { $ne: 'employee_id' };
    if (department) query.department = department;
    if (category) query.category = category;
    if (status) query.employment_status = status;
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      query.$or = [{ employee_id: regex }, { full_name: regex }, { department: regex }, { job_title: regex }, { official_email: regex }];
    }
    const [items, total] = await Promise.all([
      collection.find(query, { projection: { compensation_ciphertext: 0, compensation_iv: 0, compensation_tag: 0, documents: 0, executive_slot: 0 } })
        .sort({ employee_id: 1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
      collection.countDocuments(query),
    ]);
    return { items: this.toAppList(items), total };
  }

  async stats() {
    const collection = await this.getCollection();
    const employeeOnly = { _id: { $ne: 'employee_id' } };
    const activeEmployees = { ...employeeOnly, employment_status: { $nin: ['terminated', 'fired', 'resigned'] } };
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [total, active, onLeave, newThisMonth, departments] = await Promise.all([
      collection.countDocuments(activeEmployees),
      collection.countDocuments({ ...employeeOnly, employment_status: 'active' }),
      collection.countDocuments({ ...employeeOnly, employment_status: 'on_leave' }),
      collection.countDocuments({ ...employeeOnly, created_at: { $gte: monthStart } }),
      collection.aggregate([
        { $match: activeEmployees },
        { $group: { _id: '$department', total: { $sum: 1 } } },
        { $sort: { total: -1, _id: 1 } },
        { $limit: 8 },
      ]).toArray(),
    ]);
    return { total, active, on_leave: onLeave, new_this_month: newThisMonth, departments: departments.map((row: any) => ({ department: row._id || 'Unassigned', total: row.total })) };
  }

  async findById(id: string) {
    const mongodb = await this.getMongoDb();
    const collection = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return null; }
    const doc = await collection.findOne({ _id: oid });
    return doc ? this.toApp(doc) : null;
  }

  async create(data: Record<string, any>) {
    const mongodb = await this.getMongoDb();
    const collection = await this.getCollection();
    const sequence = await this.nextSequence();
    const now = new Date();
    const slots = positionSlots(data.category);
    const candidates: Array<string | null> = slots.length ? slots : [null];
    for (const slot of candidates) {
      const doc = {
        _id: new mongodb.ObjectId(),
        employee_id: `SEG-${String(sequence).padStart(5, '0')}`,
        ...data,
        ...(slot ? { executive_slot: slot } : {}),
        created_at: now,
        updated_at: now,
      };
      try {
        await collection.insertOne(doc);
        return this.toApp(doc);
      } catch (error: any) {
        if (error?.code === 11000 && error?.keyPattern?.executive_slot && slot) continue;
        throw error;
      }
    }
    throw positionLimitError(data.category);
  }

  async update(id: string, updates: Record<string, any>) {
    const mongodb = await this.getMongoDb();
    const collection = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return null; }
    const current = await collection.findOne({ _id: oid });
    if (!current) return null;
    const category = updates.category ?? current.category;
    const status = updates.employment_status ?? current.employment_status;
    const slots = ['active', 'on_leave'].includes(String(status).toLowerCase()) ? positionSlots(category) : [];
    if (!slots.length) {
      const result = await collection.findOneAndUpdate(
        { _id: oid },
        { $set: { ...updates, executive_slot: null, updated_at: new Date() } },
        { returnDocument: 'after' },
      );
      return result ? this.toApp(result) : null;
    }

    const candidates = [current.executive_slot, ...slots].filter((slot, index, all) => slots.includes(slot) && all.indexOf(slot) === index);
    for (const slot of candidates) {
      try {
        const result = await collection.findOneAndUpdate(
          { _id: oid },
          { $set: { ...updates, executive_slot: slot, updated_at: new Date() } },
          { returnDocument: 'after' },
        );
        return result ? this.toApp(result) : null;
      } catch (error: any) {
        if (error?.code === 11000 && error?.keyPattern?.executive_slot) continue;
        throw error;
      }
    }
    throw positionLimitError(category);
  }

  async addDocument(id: string, document: Record<string, any>) {
    const mongodb = await this.getMongoDb();
    const collection = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return false; }
    const result = await collection.updateOne({ _id: oid }, { $push: { documents: document }, $set: { updated_at: new Date() } });
    return result.matchedCount > 0;
  }

  async removeDocument(id: string, documentId: string) {
    const mongodb = await this.getMongoDb();
    const collection = await this.getCollection();
    let oid: any;
    try { oid = new mongodb.ObjectId(id); } catch { return false; }
    const result = await collection.updateOne({ _id: oid }, { $pull: { documents: { id: documentId } }, $set: { updated_at: new Date() } });
    return result.matchedCount > 0;
  }
}
