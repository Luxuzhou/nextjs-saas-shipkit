'use client';

import { Progress } from '@/components/ui/progress';

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

/**
 * Displays a labelled progress bar showing used / limit.
 */
export function UsageMeter({ label, used, limit, unit = 'tokens' }: UsageMeterProps) {
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const formattedUsed = used.toLocaleString();
  const formattedLimit = limit.toLocaleString();

  const colorClass =
    percent >= 90
      ? 'text-red-600'
      : percent >= 70
      ? 'text-amber-600'
      : 'text-green-600';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${colorClass}`}>
          {formattedUsed} / {formattedLimit} {unit}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
      <p className="text-xs text-gray-500 text-right">{percent.toFixed(1)}% used</p>
    </div>
  );
}
