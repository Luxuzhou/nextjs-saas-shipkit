'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DailyDataPoint = {
  date: string;
  count: number;
};

type SignupChartProps = {
  data: DailyDataPoint[];
};

export function SignupChart({ data }: SignupChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    // Show only MM-DD for readability
    label: d.date.slice(5),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">New Signups (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value, 'Signups']}
              labelFormatter={(label) => `Date: ${String(label)}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

type SubscriptionBarProps = {
  active: number;
  trialing: number;
  canceled: number;
};

export function SubscriptionBar({ active, trialing, canceled }: SubscriptionBarProps) {
  const data = [
    { status: 'Active', count: active },
    { status: 'Trialing', count: trialing },
    { status: 'Canceled', count: canceled },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Subscriptions by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(value) => [value, 'Teams']} />
            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
