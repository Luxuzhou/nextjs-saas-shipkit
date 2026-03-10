export enum NotificationType {
  // Account-related
  ACCOUNT_CREATED = 'account_created',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_VERIFIED = 'email_verified',

  // Team-related
  TEAM_MEMBER_INVITED = 'team_member_invited',
  TEAM_MEMBER_JOINED = 'team_member_joined',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
  TEAM_UPDATED = 'team_updated',

  // Billing-related
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',

  // AI usage
  USAGE_LIMIT_WARNING = 'usage_limit_warning',
  USAGE_LIMIT_EXCEEDED = 'usage_limit_exceeded',

  // System
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  ALL = 'all',
}

export type WebhookEvent =
  | 'team.member.invited'
  | 'team.member.joined'
  | 'team.member.removed'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'usage.limit.warning'
  | 'usage.limit.exceeded'
  | 'security.alert';

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  'team.member.invited',
  'team.member.joined',
  'team.member.removed',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'payment.succeeded',
  'payment.failed',
  'usage.limit.warning',
  'usage.limit.exceeded',
  'security.alert',
];

export interface SendNotificationOptions {
  userId: number;
  teamId?: number;
  type: NotificationType;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  teamId: number;
  data: Record<string, unknown>;
}
