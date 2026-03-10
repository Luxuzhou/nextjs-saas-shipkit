'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { InvoiceSummary } from '@/lib/billing/types';

interface InvoiceTableProps {
  invoices: InvoiceSummary[];
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function InvoiceTable({ invoices, isLoading }: InvoiceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invoices yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Period
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      {formatDate(invoice.periodStart)} -{' '}
                      {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="py-3 px-2 font-medium">
                      ${parseFloat(invoice.totalAmount).toFixed(2)}{' '}
                      <span className="text-gray-400 text-xs">
                        {invoice.currency}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {formatDate(invoice.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
