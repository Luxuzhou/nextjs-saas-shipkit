'use client';

import { useCallback } from 'react';

interface TrackEventOptions {
  eventName: string;
  eventData?: Record<string, unknown>;
  pageUrl?: string;
}

export function useTrackEvent() {
  const trackEvent = useCallback(
    async ({ eventName, eventData, pageUrl }: TrackEventOptions) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName,
            eventData,
            pageUrl: pageUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
            referrer: typeof document !== 'undefined' ? document.referrer : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          }),
        });
      } catch (error) {
        console.warn('[Analytics] Failed to track event:', error);
      }
    },
    []
  );

  return { trackEvent };
}
