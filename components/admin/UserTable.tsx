'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AdminUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  deletedAt: string | null;
};

type ApiResponse = {
  users: AdminUser[];
  total: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageSize = 20;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { data, isLoading } = useSWR<ApiResponse>(
    `/api/admin/users?${params}`,
    fetcher
  );

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {debouncedSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setDebouncedSearch('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Total count */}
      <p className="text-sm text-gray-500">
        {isLoading ? 'Loading…' : `${total} user${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Table */}
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8 text-xs font-medium text-gray-500">ID</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Name</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Email</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Role</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
              <TableHead className="text-xs font-medium text-gray-500">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500 text-sm">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs text-gray-400 font-mono">{user.id}</TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">
                    {user.name ?? <span className="text-gray-400 italic">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.deletedAt ? (
                      <Badge variant="destructive" className="text-xs">Deleted</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-700 border-green-200 bg-green-50"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
