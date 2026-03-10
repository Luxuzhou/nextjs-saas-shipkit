'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { JSONSchema, JSONSchemaProperty, PluginWithInstallation } from '@/lib/plugins/types';

interface PluginConfigFormProps {
  plugin: PluginWithInstallation | null;
  open: boolean;
  onClose: () => void;
  onSave: (slug: string, config: Record<string, unknown>) => Promise<void>;
  onGenerateApiKey?: (slug: string) => Promise<string | null>;
}

function FieldInput({
  fieldKey,
  schema,
  value,
  onChange,
}: {
  fieldKey: string;
  schema: JSONSchemaProperty;
  value: unknown;
  onChange: (key: string, val: unknown) => void;
}) {
  const isPassword = schema.format === 'password';
  const isBoolean = schema.type === 'boolean';
  const isArray = schema.type === 'array';

  if (isBoolean) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={fieldKey}
          checked={Boolean(value ?? schema.default)}
          onChange={(e) => onChange(fieldKey, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor={fieldKey} className="text-sm font-normal cursor-pointer">
          {schema.title ?? fieldKey}
        </Label>
      </div>
    );
  }

  if (isArray) {
    const arrVal = Array.isArray(value) ? value.join(', ') : '';
    return (
      <div>
        <Label htmlFor={fieldKey} className="text-sm font-medium">
          {schema.title ?? fieldKey}
        </Label>
        {schema.description && (
          <p className="text-xs text-gray-500 mt-0.5 mb-1">{schema.description}</p>
        )}
        <Input
          id={fieldKey}
          placeholder="comma-separated values"
          value={arrVal}
          onChange={(e) =>
            onChange(
              fieldKey,
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={fieldKey} className="text-sm font-medium">
        {schema.title ?? fieldKey}
      </Label>
      {schema.description && (
        <p className="text-xs text-gray-500 mt-0.5 mb-1">{schema.description}</p>
      )}
      <Input
        id={fieldKey}
        type={isPassword ? 'password' : schema.format === 'url' ? 'url' : 'text'}
        placeholder={schema.format ?? ''}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
      />
    </div>
  );
}

export function PluginConfigForm({
  plugin,
  open,
  onClose,
  onSave,
  onGenerateApiKey,
}: PluginConfigFormProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configSchema = plugin?.configSchema as JSONSchema | undefined;
  const properties = configSchema?.properties ?? {};
  const required = configSchema?.required ?? [];

  // Merge installed config with local form state
  const getFieldValue = (key: string): unknown => {
    if (key in formValues) return formValues[key];
    const installed = plugin?.installedConfig ?? {};
    if (key in installed) return installed[key];
    return properties[key]?.default;
  };

  const handleChange = (key: string, val: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!plugin) return;
    setError(null);

    // Validate required fields
    for (const req of required) {
      const val = getFieldValue(req);
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        setError(`"${properties[req]?.title ?? req}" is required`);
        return;
      }
    }

    // Merge installed config with form changes
    const merged: Record<string, unknown> = {
      ...(plugin.installedConfig ?? {}),
      ...formValues,
    };

    setSaving(true);
    try {
      await onSave(plugin.slug, merged);
      setFormValues({});
      onClose();
    } catch {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!plugin || !onGenerateApiKey) return;
    setGeneratingKey(true);
    setGeneratedKey(null);
    try {
      const key = await onGenerateApiKey(plugin.slug);
      setGeneratedKey(key);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleClose = () => {
    setFormValues({});
    setError(null);
    setGeneratedKey(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {plugin?.name}</DialogTitle>
          <DialogDescription>
            Update the settings for this integration. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {Object.keys(properties).length === 0 && (
            <p className="text-sm text-gray-500">This plugin has no configurable options.</p>
          )}

          {Object.entries(properties).map(([key, schema]) => (
            <div key={key}>
              <FieldInput
                fieldKey={key}
                schema={schema}
                value={getFieldValue(key)}
                onChange={handleChange}
              />
              {required.includes(key) && schema.type !== 'boolean' && (
                <span className="text-xs text-red-500 ml-0.5">*</span>
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* API Key section */}
          {onGenerateApiKey && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">API Key</p>
              <p className="text-xs text-gray-500 mb-2">
                Generate a plugin-specific API key to authenticate webhook calls.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateKey}
                disabled={generatingKey}
              >
                {generatingKey ? 'Generating…' : 'Generate API Key'}
              </Button>
              {generatedKey && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Copy this key — it will only be shown once:
                  </p>
                  <code className="block text-xs bg-gray-100 rounded px-2 py-1.5 break-all select-all">
                    {generatedKey}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
