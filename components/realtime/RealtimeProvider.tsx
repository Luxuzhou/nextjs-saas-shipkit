'use client';

import {
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { useRealtimeEvents } from './useRealtimeEvents';
import { RealtimeEvent, UserPresence } from '@/lib/realtime/types';

interface RealtimeContextValue {
  events: RealtimeEvent[];
  isConnected: boolean;
  onlineMembers: UserPresence[];
}

const RealtimeContext = createContext<RealtimeContextValue>({
  events: [],
  isConnected: false,
  onlineMembers: [],
});

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const realtimeData = useRealtimeEvents();

  return (
    <RealtimeContext.Provider value={realtimeData}>
      {children}
    </RealtimeContext.Provider>
  );
}
