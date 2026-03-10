'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    setPending(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium mb-4">Invalid reset link</p>
        <p className="text-sm text-gray-600 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-orange-600 hover:text-orange-500 font-medium text-sm"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-green-600 font-medium mb-4">
          Password reset successfully!
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Your password has been updated. You can now sign in with your new
          password.
        </p>
        <Link
          href="/sign-in"
          className="text-orange-600 hover:text-orange-500 font-medium text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700"
        >
          New password
        </Label>
        <div className="mt-1">
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={100}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
            placeholder="Enter new password (min. 8 characters)"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm new password
        </Label>
        <div className="mt-1">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={100}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div>
        <Button
          type="submit"
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Resetting...
            </>
          ) : (
            'Reset password'
          )}
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/sign-in"
          className="text-sm text-orange-600 hover:text-orange-500"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
