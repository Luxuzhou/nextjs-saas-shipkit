'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

interface FeatureFlagContextValue {
  flags: Record<string, boolean>;
  isLoading: boolean;
  refresh: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  flags: {},
  isLoading: true,
  refresh: () => {},
});

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  /** Override initial flag values (e.g. from SSR). */
  initialFlags?: Record<string, boolean>;
}

export function FeatureFlagProvider({
  children,
  initialFlags = {},
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [isLoading, setIsLoading] = useState(Object.keys(initialFlags).length === 0);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feature-flags/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [] }), // empty = evaluate all
      });
      if (res.ok) {
        const data = (await res.json()) as { flags: Record<string, boolean> };
        setFlags(data.flags ?? {});
      }
    } catch (err) {
      console.warn('[FeatureFlagProvider] Failed to fetch flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(initialFlags).length === 0) {
      refresh();
    }
  }, [refresh, initialFlags]);

  const value: FeatureFlagContextValue = { flags, isLoading, refresh };

  return React.createElement(FeatureFlagContext.Provider, { value }, children);
}

/**
 * Hook to check a single feature flag. Returns false while loading.
 */
export function useFeatureFlag(key: string): boolean {
  const { flags, isLoading } = useContext(FeatureFlagContext);
  if (isLoading) return false;
  return flags[key] ?? false;
}

/**
 * Hook to access all flag values and loading state.
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  return useContext(FeatureFlagContext);
}

interface FeatureGateProps {
  flag: string;
  /** Rendered when the flag is ON. */
  children: React.ReactNode;
  /** Optionally render something when the flag is OFF. */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the named flag is enabled.
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeatureFlag(flag);
  return React.createElement(
    React.Fragment,
    null,
    enabled ? children : fallback
  );
}
