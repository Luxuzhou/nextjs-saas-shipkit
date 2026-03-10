'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Save } from 'lucide-react';
import type { RetentionPolicyEntry } from '@/lib/compliance/types';
import { DEFAULT_RETENTION } from '@/lib/compliance/retention';

interface RetentionSettingsProps {
  teamId: number;
}

type EditState = Record<string, { days: string; saving: boolean }>;

export function RetentionSettings({ teamId }: RetentionSettingsProps) {
  const [policies, setPolicies] = useState<RetentionPolicyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editState, setEditState] = useState<EditState>({});

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/compliance/retention?teamId=${teamId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json() as { policies: RetentionPolicyEntry[] };
      setPolicies(data.policies);
    } catch (error) {
      console.error('Failed to fetch retention policies:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  const getEffectiveDays = (resource: string): number => {
    const policy = policies.find((p) => p.resource === resource && p.isActive);
    if (policy) return policy.retentionDays;
    return DEFAULT_RETENTION[resource] ?? 365;
  };

  const handleEdit = (resource: string, currentDays: number) => {
    setEditState((prev) => ({
      ...prev,
      [resource]: { days: String(currentDays), saving: false },
    }));
  };

  const handleCancel = (resource: string) => {
    setEditState((prev) => {
      const next = { ...prev };
      delete next[resource];
      return next;
    });
  };

  const handleSave = async (resource: string) => {
    const state = editState[resource];
    if (!state) return;

    const days = parseInt(state.days, 10);
    if (isNaN(days) || days < 1) {
      alert('Please enter a valid number of days (minimum 1)');
      return;
    }

    setEditState((prev) => ({
      ...prev,
      [resource]: { ...prev[resource]!, saving: true },
    }));

    try {
      const res = await fetch('/api/compliance/retention', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, resource, retentionDays: days, isActive: true }),
      });

      if (!res.ok) throw new Error('Failed to save');

      await fetchPolicies();
      handleCancel(resource);
    } catch (error) {
      console.error('Failed to save retention policy:', error);
      alert('Failed to save. Please try again.');
      setEditState((prev) => ({
        ...prev,
        [resource]: { ...prev[resource]!, saving: false },
      }));
    }
  };

  const resources = Object.keys(DEFAULT_RETENTION);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Data Retention Policies</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Configure how long each type of data is retained.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchPolicies()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {resources.map((resource) => {
            const effectiveDays = getEffectiveDays(resource);
            const customPolicy = policies.find((p) => p.resource === resource);
            const isEditing = resource in editState;
            const state = editState[resource];

            return (
              <div
                key={resource}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {resource.replace('_', ' ')}
                    </span>
                    {customPolicy ? (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                        Custom
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {effectiveDays} days retention
                  </p>
                </div>

                {isEditing && state ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="36500"
                      value={state.days}
                      onChange={(e) =>
                        setEditState((prev) => ({
                          ...prev,
                          [resource]: { ...prev[resource]!, days: e.target.value },
                        }))
                      }
                      className="w-24 h-8 text-sm"
                    />
                    <span className="text-xs text-gray-500">days</span>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => void handleSave(resource)}
                      disabled={state.saving}
                    >
                      {state.saving ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => handleCancel(resource)}
                      disabled={state.saving}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleEdit(resource, effectiveDays)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
