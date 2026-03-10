import { getAdminUser } from '@/lib/db/admin-auth';
import { getUserStats } from '@/lib/db/admin-queries';
import { UserTable } from '@/components/admin/UserTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await getAdminUser();
  const stats = await getUserStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats.total} total · {stats.active} active · {stats.deleted} deleted
        </p>
      </div>
      <UserTable />
    </div>
  );
}
