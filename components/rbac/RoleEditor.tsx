'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Resource, Action } from '@/lib/rbac/types';

interface RoleEditorProps {
  initialName?: string;
  initialDescription?: string;
  initialPermissions?: Record<string, boolean>;
  allPermissions: { id: number; resource: string; action: string }[];
  isSystem?: boolean;
  onSave: (data: {
    name: string;
    description: string;
    permissionIds: number[];
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

const RESOURCE_LABELS: Record<string, string> = {
  team: 'Team',
  member: 'Members',
  billing: 'Billing',
  admin: 'Admin',
  ai_usage: 'AI Usage',
  notifications: 'Notifications',
  plugins: 'Plugins',
  compliance: 'Compliance',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  manage: 'Manage',
};

export function RoleEditor({
  initialName = '',
  initialDescription = '',
  initialPermissions = {},
  allPermissions,
  isSystem = false,
  onSave,
  onCancel,
  saving = false,
}: RoleEditorProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [selectedPerms, setSelectedPerms] = useState<Record<string, boolean>>(
    initialPermissions
  );

  const resources = Object.values(Resource);
  const actions = Object.values(Action);

  const togglePerm = (permId: number) => {
    if (isSystem) return;
    setSelectedPerms((prev) => ({
      ...prev,
      [permId]: !prev[permId],
    }));
  };

  const getPermId = (resource: string, action: string): number | undefined => {
    const perm = allPermissions.find(
      (p) => p.resource === resource && p.action === action
    );
    return perm?.id;
  };

  const handleSave = () => {
    const permissionIds = Object.entries(selectedPerms)
      .filter(([, selected]) => selected)
      .map(([id]) => parseInt(id, 10));

    onSave({ name, description, permissionIds });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {initialName ? `Edit Role: ${initialName}` : 'Create New Role'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSystem}
              placeholder="e.g. editor"
            />
          </div>
          <div>
            <Label htmlFor="role-desc">Description</Label>
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSystem}
              placeholder="e.g. Can edit content"
            />
          </div>
        </div>

        {/* Permission Matrix */}
        <div>
          <Label className="mb-2 block">Permission Matrix</Label>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 font-medium text-gray-600">
                    Resource
                  </th>
                  {actions.map((action) => (
                    <th
                      key={action}
                      className="text-center p-2 font-medium text-gray-600"
                    >
                      {ACTION_LABELS[action] ?? action}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource} className="border-b last:border-0">
                    <td className="p-2 font-medium text-gray-700">
                      {RESOURCE_LABELS[resource] ?? resource}
                    </td>
                    {actions.map((action) => {
                      const permId = getPermId(resource, action);
                      const isChecked = permId
                        ? !!selectedPerms[permId]
                        : false;
                      return (
                        <td key={action} className="text-center p-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => permId && togglePerm(permId)}
                            disabled={isSystem}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isSystem && (
            <p className="text-xs text-gray-500 mt-1">
              System role permissions cannot be modified.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          {!isSystem && (
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Role'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
