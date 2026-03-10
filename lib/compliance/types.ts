export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  INVITE = 'invite',
  REVOKE = 'revoke',
  APPROVE = 'approve',
  REJECT = 'reject',
}

export enum AuditResource {
  USER = 'user',
  TEAM = 'team',
  TEAM_MEMBER = 'team_member',
  INVITATION = 'invitation',
  SUBSCRIPTION = 'subscription',
  PAYMENT = 'payment',
  API_KEY = 'api_key',
  FEATURE_FLAG = 'feature_flag',
  NOTIFICATION = 'notification',
  COMPLIANCE = 'compliance',
  DATA_EXPORT = 'data_export',
  RETENTION_POLICY = 'retention_policy',
  AUDIT_LOG = 'audit_log',
}

export type DataExportType =
  | 'full_export'
  | 'user_data'
  | 'team_data'
  | 'billing_data'
  | 'activity_data';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export interface AuditLogFilter {
  userId?: number;
  teamId?: number;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface AuditLogEntry {
  id: number;
  teamId: number | null;
  userId: number | null;
  action: string;
  resource: string;
  resourceId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  userEmail?: string | null;
  teamName?: string | null;
}

export interface ExportHistoryEntry {
  id: number;
  userId: number;
  teamId: number | null;
  type: string;
  status: string;
  fileUrl: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
}

export interface RetentionPolicyEntry {
  id: number;
  teamId: number;
  resource: string;
  retentionDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
