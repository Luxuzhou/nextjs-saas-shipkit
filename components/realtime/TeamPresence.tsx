'use client';

import { UserPresence } from '@/lib/realtime/types';
import { OnlineIndicator } from './OnlineIndicator';

interface TeamPresenceProps {
  members: UserPresence[];
  className?: string;
  maxVisible?: number;
}

export function TeamPresence({
  members,
  className = '',
  maxVisible = 5,
}: TeamPresenceProps) {
  const onlineMembers = members.filter((m) => m.status !== 'offline');
  const visibleMembers = onlineMembers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, onlineMembers.length - maxVisible);

  if (onlineMembers.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <OnlineIndicator status="offline" size="sm" />
        <span>No members online</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Online ({onlineMembers.length})
      </div>
      <div className="flex flex-col gap-1.5">
        {visibleMembers.map((member) => (
          <div key={member.userId} className="flex items-center gap-2">
            <OnlineIndicator status={member.status} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
                {member.userName}
              </span>
              <span className="text-xs text-gray-500 leading-none mt-0.5">
                {member.status === 'away' ? 'Away' : 'Active'}
              </span>
            </div>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="text-xs text-gray-500">
            +{hiddenCount} more online
          </div>
        )}
      </div>
    </div>
  );
}
