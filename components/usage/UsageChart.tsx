'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyTotal {
  date: string;
  tokens: number;
  cost: string;
}

interface UsageChartProps {
  data: DailyTotal[];
}

/**
 * Bar chart showing daily token usage over the current month.
 */
export function UsageChart({ data }: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No usage data for this period.
      </div>
    );
  }

  // Format date labels: "Mar 1" style
  const chartData = data.map((d) => {
    const date = new Date(d.date + 'T00:00:00Z');
    const label = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return { label, tokens: d.tokens, cost: parseFloat(d.cost) };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'tokens') {
              const num = typeof value === 'number' ? value : Number(value);
              return [num.toLocaleString(), 'Tokens'];
            }
            return [String(value), String(name)];
          }}
        />
        <Bar dataKey="tokens" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
