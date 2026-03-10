'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleEditor } from '@/components/rbac/RoleEditor';
import { RoleAssigner } from '@/components/rbac/RoleAssigner';
import { Shield, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Resource, Action } from '@/lib/rbac/types';
import { SYSTEM_PERMISSIONS } from '@/lib/rbac/constants';

interface RoleData {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  memberCount: number;
  teamId: number;
  createdAt: string;
}

interface PermissionData {
  id: number;
  resource: string;
  action: string;
  description: string | null;
}

interface MemberData {
  id: number;
  name: string | null;
  email: string;
  currentRole?: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes, teamRes] = await Promise.all([
        fetch('/api/rbac/roles'),
        fetch('/api/rbac/permissions'),
        fetch('/api/team'),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      }

      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setAllPermissions(
          Array.isArray(permsData.allPermissions)
            ? permsData.allPermissions
            : SYSTEM_PERMISSIONS.map((p, i) => ({
                id: i + 1,
                resource: p.resource,
                action: p.action,
                description: `${p.action} ${p.resource}`,
              }))
        );
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData?.teamMembers) {
          setMembers(
            teamData.teamMembers.map(
              (tm: { user: { id: number; name: string | null; email: string }; role: string }) => ({
                id: tm.user.id,
                name: tm.user.name,
                email: tm.user.email,
                currentRole: tm.role,
              })
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch RBAC data:', err);
      setError('Failed to load role data. The RBAC tables may not be set up yet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data: {
    name: string;
    description: string;
    permissionIds: number[];
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create role');
        return;
      }
      setCreatingRole(false);
      await fetchData();
    } catch {
      setError('Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description: string;
    permissionIds: number[];
  }) => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rbac/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to update role');
        return;
      }
      setEditingRole(null);
      await fetchData();
    } catch {
      setError('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      const res = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to delete role');
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to delete role');
    }
  };

  const handleAssign = async (userId: number, roleId: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/rbac/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to assign role');
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            Role Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles and permissions for your team
          </p>
        </div>
        {!creatingRole && !editingRole && (
          <Button
            onClick={() => setCreatingRole(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Role
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button
            className="ml-2 text-red-500 underline"
            onClick={() => setError(null)}
          >
            dismiss
          </button>
        </div>
      )}

      {/* Create / Edit Role */}
      {creatingRole && (
        <RoleEditor
          allPermissions={allPermissions}
          onSave={handleCreate}
          onCancel={() => setCreatingRole(false)}
          saving={saving}
        />
      )}

      {editingRole && (
        <RoleEditor
          initialName={editingRole.name}
          initialDescription={editingRole.description ?? ''}
          allPermissions={allPermissions}
          isSystem={editingRole.isSystem}
          onSave={handleUpdate}
          onCancel={() => setEditingRole(null)}
          saving={saving}
        />
      )}

      {/* Role List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No roles defined yet. RBAC tables may need to be migrated, or you
              can create roles manually.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between py-3 px-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-orange-50 text-orange-700"
                        >
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {role.description ?? 'No description'}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {role.permissionCount} permission
                        {role.permissionCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {role.memberCount} member
                        {role.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                      title="Edit role"
                    >
                      <Pencil className="h-4 w-4 text-gray-400" />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                        title="Delete role"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assigner */}
      {roles.length > 0 && members.length > 0 && (
        <RoleAssigner
          members={members}
          roles={roles.map((r) => ({
            id: r.id,
            name: r.name,
            isSystem: r.isSystem,
          }))}
          onAssign={handleAssign}
          assigning={saving}
        />
      )}
    </div>
  );
}
