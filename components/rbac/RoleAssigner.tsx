'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';

interface TeamMemberInfo {
  id: number;
  name: string | null;
  email: string;
  currentRole?: string;
}

interface RoleOption {
  id: number;
  name: string;
  isSystem: boolean;
}

interface RoleAssignerProps {
  members: TeamMemberInfo[];
  roles: RoleOption[];
  onAssign: (userId: number, roleId: number) => void;
  assigning?: boolean;
}

export function RoleAssigner({
  members,
  roles: roleOptions,
  onAssign,
  assigning = false,
}: RoleAssignerProps) {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  const handleAssign = () => {
    if (selectedUser !== null && selectedRole !== null) {
      onAssign(selectedUser, selectedRole);
      setSelectedUser(null);
      setSelectedRole(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Assign Roles to Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="assign-user"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Member
            </label>
            <select
              id="assign-user"
              value={selectedUser ?? ''}
              onChange={(e) =>
                setSelectedUser(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name ?? member.email}{' '}
                  {member.currentRole ? `(${member.currentRole})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="assign-role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Role
            </label>
            <select
              id="assign-role"
              value={selectedRole ?? ''}
              onChange={(e) =>
                setSelectedRole(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a role...</option>
              {roleOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.isSystem ? '(system)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleAssign}
            disabled={
              assigning || selectedUser === null || selectedRole === null
            }
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {assigning ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>

        {/* Current assignments */}
        {members.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Current Assignments
            </h4>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-600">
                    {member.name ?? member.email}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {member.currentRole ?? 'No role'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
