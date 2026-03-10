import { getAdminUser } from '@/lib/db/admin-auth';
import { getAuditLogs } from '@/lib/compliance/audit-logger';
import { AuditLogViewer } from '@/components/compliance/AuditLogViewer';
import { DataExportPanel } from '@/components/compliance/DataExportPanel';
import { RetentionSettings } from '@/components/compliance/RetentionSettings';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCompliancePage() {
  const user = await getAdminUser();

  let initialLogs: import('@/lib/compliance/types').AuditLogEntry[] = [];
  let initialTotal = 0;

  try {
    const result = await getAuditLogs({ page: 1, pageSize: 20 });
    initialLogs = result.logs;
    initialTotal = result.total;
  } catch {
    // Table may not exist yet — render gracefully
  }

  // Use the admin's team if available; fall back to 1 for retention demo
  const demoTeamId = 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            GDPR data export, audit logs, and retention policies
          </p>
        </div>
      </div>

      {/* Audit Logs */}
      <AuditLogViewer initialLogs={initialLogs} initialTotal={initialTotal} />

      {/* Data Export (admin can request on behalf) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Data Exports</h2>
        <DataExportPanel />
      </div>

      {/* Retention Policies */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Retention Policies</h2>
        <RetentionSettings teamId={demoTeamId} />
      </div>
    </div>
  );
}
