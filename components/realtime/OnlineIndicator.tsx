'use client';

import { PresenceStatus } from '@/lib/realtime/types';

interface OnlineIndicatorProps {
  status: PresenceStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-400',
  offline: 'bg-gray-400',
};

const statusLabels: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function OnlineIndicator({
  status,
  className = '',
  size = 'md',
}: OnlineIndicatorProps) {
  return (
    <span
      className={`inline-block rounded-full ${statusColors[status]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={statusLabels[status]}
      title={statusLabels[status]}
    />
  );
}
