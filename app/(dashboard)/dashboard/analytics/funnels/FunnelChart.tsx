'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelStep {
  name: string;
  users: number;
  rate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  funnelName: string;
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export function FunnelChart({ steps, funnelName }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No funnel data available
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{funnelName}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={steps} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="users" name="users" radius={[4, 4, 0, 0]}>
            {steps.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Conversion rates */}
      <div className="mt-3 flex flex-wrap gap-2">
        {steps.map((step, idx) => (
          <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1">
            <span className="font-medium">{step.name}</span>
            <span className="text-gray-500 ml-1">
              {step.users} users{idx > 0 ? ` (${step.rate}%)` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
