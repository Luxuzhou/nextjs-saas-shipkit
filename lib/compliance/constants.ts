import { AuditResource } from './types';

/** Default retention days per resource type (client-safe, no DB imports) */
export const DEFAULT_RETENTION: Record<string, number> = {
  [AuditResource.AUDIT_LOG]: 365,
  [AuditResource.USER]: 2555, // ~7 years
  [AuditResource.TEAM]: 2555,
  [AuditResource.TEAM_MEMBER]: 365,
  [AuditResource.INVITATION]: 90,
  [AuditResource.SUBSCRIPTION]: 2555,
  [AuditResource.PAYMENT]: 2555,
  [AuditResource.API_KEY]: 365,
  [AuditResource.NOTIFICATION]: 90,
  [AuditResource.DATA_EXPORT]: 7,
};
