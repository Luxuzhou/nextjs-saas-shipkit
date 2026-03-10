'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Flag, Loader2, AlertCircle } from 'lucide-react';

type FlagType = 'boolean' | 'percentage' | 'userList' | 'teamList';

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string | null;
  type: string;
  enabled: boolean;
  rolloutPercentage: number | null;
  targetUserIds: number[] | null;
  targetTeamIds: number[] | null;
  createdAt: string;
  updatedAt: string;
}

interface FlagFormData {
  key: string;
  name: string;
  description: string;
  type: FlagType;
  enabled: boolean;
  rolloutPercentage: number;
  targetUserIds: string; // comma-separated
  targetTeamIds: string; // comma-separated
}

const defaultForm: FlagFormData = {
  key: '',
  name: '',
  description: '',
  type: 'boolean',
  enabled: false,
  rolloutPercentage: 0,
  targetUserIds: '',
  targetTeamIds: '',
};

function parseIds(input: string): number[] {
  return input
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    boolean: 'Global',
    percentage: 'Percentage',
    userList: 'User List',
    teamList: 'Team List',
  };
  return labels[type] ?? type;
}

function typeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    boolean: 'bg-blue-100 text-blue-800',
    percentage: 'bg-yellow-100 text-yellow-800',
    userList: 'bg-purple-100 text-purple-800',
    teamList: 'bg-green-100 text-green-800',
  };
  return colors[type] ?? 'bg-gray-100 text-gray-800';
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [form, setForm] = useState<FlagFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feature-flags');
      if (!res.ok) throw new Error('Failed to fetch flags');
      const data = (await res.json()) as { flags: FeatureFlag[] };
      setFlags(data.flags ?? []);
    } catch {
      setError('Failed to load feature flags. The database table may not exist yet.');
      setFlags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  function openCreate() {
    setEditingFlag(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(flag: FeatureFlag) {
    setEditingFlag(flag);
    setForm({
      key: flag.key,
      name: flag.name,
      description: flag.description ?? '',
      type: flag.type as FlagType,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage ?? 0,
      targetUserIds: (flag.targetUserIds ?? []).join(', '),
      targetTeamIds: (flag.targetTeamIds ?? []).join(', '),
    });
    setDialogOpen(true);
  }

  async function handleToggle(flag: FeatureFlag) {
    try {
      const res = await fetch(`/api/feature-flags/${flag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
      );
    } catch {
      alert('Failed to toggle flag. Please try again.');
    }
  }

  async function handleSave() {
    if (!form.key.trim() || !form.name.trim()) {
      alert('Key and name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        enabled: form.enabled,
        rolloutPercentage: form.rolloutPercentage,
        targetUserIds: parseIds(form.targetUserIds),
        targetTeamIds: parseIds(form.targetTeamIds),
      };

      let res: Response;
      if (editingFlag) {
        res = await fetch(`/api/feature-flags/${editingFlag.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = (await res.json()) as { error?: string; flag?: FeatureFlag };

      if (!res.ok) {
        alert(data.error ?? 'Save failed');
        return;
      }

      setDialogOpen(false);
      await fetchFlags();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/feature-flags/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch {
      alert('Failed to delete flag. Please try again.');
    } finally {
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flag className="h-6 w-6 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Control feature rollouts and targeting
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Flag
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && flags.length === 0 && (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg">
          <Flag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No feature flags yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first flag to start controlling feature rollouts
          </p>
          <Button variant="outline" onClick={openCreate} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Flag
          </Button>
        </div>
      )}

      {/* Flag list */}
      {!isLoading && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-gray-800">
                    {flag.key}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-sm text-gray-600">{flag.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColor(flag.type)}`}
                  >
                    {typeLabel(flag.type)}
                  </span>
                  {flag.type === 'percentage' && flag.rolloutPercentage !== null && (
                    <Badge variant="outline" className="text-xs">
                      {flag.rolloutPercentage}%
                    </Badge>
                  )}
                </div>
                {flag.description && (
                  <p className="text-sm text-gray-400 mt-1 truncate">{flag.description}</p>
                )}
                {flag.type === 'userList' && (flag.targetUserIds?.length ?? 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Users: {flag.targetUserIds?.join(', ')}
                  </p>
                )}
                {flag.type === 'teamList' && (flag.targetTeamIds?.length ?? 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Teams: {flag.targetTeamIds?.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${flag.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(flag)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(flag.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFlag ? 'Edit Flag' : 'Create Feature Flag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Key */}
            <div className="space-y-1">
              <Label htmlFor="flag-key">
                Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flag-key"
                placeholder="new-checkout-flow"
                value={form.key}
                disabled={!!editingFlag}
                onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase() })}
              />
              <p className="text-xs text-gray-400">
                Lowercase letters, numbers, hyphens, underscores only. Cannot be changed after creation.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="flag-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flag-name"
                placeholder="New Checkout Flow"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="flag-desc">Description</Label>
              <Textarea
                id="flag-desc"
                placeholder="Describe what this flag controls..."
                value={form.description}
                rows={2}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as FlagType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boolean">Global Boolean — on/off for everyone</SelectItem>
                  <SelectItem value="percentage">Percentage Rollout</SelectItem>
                  <SelectItem value="userList">User List — specific user IDs</SelectItem>
                  <SelectItem value="teamList">Team List — specific team IDs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Percentage slider */}
            {form.type === 'percentage' && (
              <div className="space-y-1">
                <Label htmlFor="flag-pct">
                  Rollout Percentage: <strong>{form.rolloutPercentage}%</strong>
                </Label>
                <input
                  id="flag-pct"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={form.rolloutPercentage}
                  onChange={(e) =>
                    setForm({ ...form, rolloutPercentage: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* User IDs */}
            {form.type === 'userList' && (
              <div className="space-y-1">
                <Label htmlFor="flag-users">Target User IDs</Label>
                <Input
                  id="flag-users"
                  placeholder="1, 2, 42"
                  value={form.targetUserIds}
                  onChange={(e) => setForm({ ...form, targetUserIds: e.target.value })}
                />
                <p className="text-xs text-gray-400">Comma-separated user IDs</p>
              </div>
            )}

            {/* Team IDs */}
            {form.type === 'teamList' && (
              <div className="space-y-1">
                <Label htmlFor="flag-teams">Target Team IDs</Label>
                <Input
                  id="flag-teams"
                  placeholder="1, 2, 5"
                  value={form.targetTeamIds}
                  onChange={(e) => setForm({ ...form, targetTeamIds: e.target.value })}
                />
                <p className="text-xs text-gray-400">Comma-separated team IDs</p>
              </div>
            )}

            {/* Enabled toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Toggle the flag on or off globally
                </p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFlag ? 'Save Changes' : 'Create Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Feature Flag</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete this flag? This action cannot be undone and
            may affect live users if the flag is currently enabled.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
