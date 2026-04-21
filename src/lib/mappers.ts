/**
 * Type mappers to convert MongoDB documents to API-friendly formats
 * These are placeholders - data is already stored with `id` as string
 */

import type { 
  User, Profile, Tool, ToolRequest, Maintenance, Alert, 
  FinancialRequest, AuditLog 
} from './database.types';

// These are identity functions since data already has `id` as string
export function mapUser(user: User): User {
  return user;
}

export function mapProfile(profile: Profile): Profile {
  return profile;
}

export function mapTool(tool: Tool): Tool {
  return tool;
}

export function mapToolRequest(req: ToolRequest): ToolRequest {
  return req;
}

export function mapMaintenance(record: Maintenance): Maintenance {
  return record;
}

export function mapAlert(alert: Alert): Alert {
  return alert;
}

export function mapFinancialRequest(req: FinancialRequest): FinancialRequest {
  return req;
}

export function mapAuditLog(log: AuditLog): AuditLog {
  return log;
}

export function mapArray<T>(items: T[], _mapper: (item: T) => T): T[] {
  return items;
}