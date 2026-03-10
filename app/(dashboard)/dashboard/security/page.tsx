'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2, Shield, Link2, Unlink } from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

interface LinkedAccount {
  id: number;
  provider: string;
  email: string | null;
  createdAt: string;
}

interface TwoFactorStatus {
  enabled: boolean;
}

interface SetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  error?: string;
}

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  // OAuth linked accounts
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/oauth/status');
      if (response.ok) {
        const data = await response.json() as {
          linkedAccounts: LinkedAccount[];
          twoFactor: TwoFactorStatus;
        };
        setLinkedAccounts(data.linkedAccounts);
        setTwoFactorStatus(data.twoFactor);
      }
    } catch {
      // Silently fail - the API may not be available
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError('');
    try {
      const response = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await response.json() as SetupResponse;
      if (!response.ok) {
        setTwoFactorError(data.error || 'Failed to set up 2FA');
        return;
      }
      setSetupData(data);
      setShowSetup(true);
    } catch {
      setTwoFactorError('Failed to set up 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError('');
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyCode }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setTwoFactorError(data.error || 'Verification failed');
        return;
      }
      setTwoFactorSuccess('2FA has been enabled successfully!');
      setTwoFactorStatus({ enabled: true });
      setShowSetup(false);
      setSetupData(null);
      setVerifyCode('');
    } catch {
      setTwoFactorError('Verification failed');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError('');
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableCode }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setTwoFactorError(data.error || 'Failed to disable 2FA');
        return;
      }
      setTwoFactorSuccess('2FA has been disabled.');
      setTwoFactorStatus({ enabled: false });
      setShowDisable(false);
      setDisableCode('');
    } catch {
      setTwoFactorError('Failed to disable 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const providerLabels: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Security Settings
      </h1>

      {/* Linked Social Accounts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect your social accounts for easier sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAccounts ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading linked accounts...
            </div>
          ) : linkedAccounts.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">
              No social accounts linked. Sign in with Google or GitHub to link your account.
            </p>
          ) : (
            <div className="space-y-3">
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {account.provider === 'google' ? (
                        <span className="text-sm font-bold text-red-500">G</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-800">GH</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {providerLabels[account.provider] || account.provider}
                      </p>
                      {account.email && (
                        <p className="text-xs text-gray-500">{account.email}</p>
                      )}
                    </div>
                  </div>
                  <Unlink className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <a href="/api/auth/oauth/google">
              <Button variant="outline" size="sm" type="button">
                Link Google
              </Button>
            </a>
            <a href="/api/auth/oauth/github">
              <Button variant="outline" size="sm" type="button">
                Link GitHub
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using a TOTP authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {twoFactorError && (
            <p className="text-red-500 text-sm mb-4">{twoFactorError}</p>
          )}
          {twoFactorSuccess && (
            <p className="text-green-500 text-sm mb-4">{twoFactorSuccess}</p>
          )}

          {twoFactorStatus.enabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">
                  2FA is enabled
                </span>
              </div>
              {!showDisable ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDisable(true);
                    setTwoFactorError('');
                    setTwoFactorSuccess('');
                  }}
                >
                  Disable 2FA
                </Button>
              ) : (
                <div className="space-y-4 max-w-sm">
                  <p className="text-sm text-gray-600">
                    Enter your current 2FA code or a backup code to disable two-factor authentication.
                  </p>
                  <div>
                    <Label htmlFor="disable-code" className="mb-2">
                      Verification Code
                    </Label>
                    <Input
                      id="disable-code"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      placeholder="Enter 6-digit code or backup code"
                      maxLength={9}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDisable2FA}
                      disabled={twoFactorLoading || !disableCode}
                      variant="destructive"
                    >
                      {twoFactorLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Confirm Disable
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDisable(false);
                        setDisableCode('');
                        setTwoFactorError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : showSetup && setupData ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>
              <div className="flex justify-center p-4 bg-white border rounded-lg max-w-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Manual entry key</Label>
                <code className="block text-xs bg-gray-100 p-2 rounded break-all select-all">
                  {setupData.secret}
                </code>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Save your backup codes
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {setupData.backupCodes.map((code, i) => (
                    <code key={i} className="text-xs bg-white p-1 rounded text-center">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="verify-code" className="mb-2">
                  Enter the 6-digit code from your app to verify
                </Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="max-w-[200px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleVerify2FA}
                  disabled={twoFactorLoading || verifyCode.length !== 6}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {twoFactorLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify & Enable
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSetup(false);
                    setSetupData(null);
                    setVerifyCode('');
                    setTwoFactorError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-500">2FA is not enabled</span>
              </div>
              <Button
                onClick={handleSetup2FA}
                disabled={twoFactorLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {twoFactorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Set Up 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={passwordAction}>
            <div>
              <Label htmlFor="current-password" className="mb-2">
                Current Password
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-2">
                New Password
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-2">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Account deletion is non-reversable. Please proceed with caution.
          </p>
          <form action={deleteAction} className="space-y-4">
            <div>
              <Label htmlFor="delete-password" className="mb-2">
                Confirm Password
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password}
              />
            </div>
            {deleteState.error && (
              <p className="text-red-500 text-sm">{deleteState.error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
