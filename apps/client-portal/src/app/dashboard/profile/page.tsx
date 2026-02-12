'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi, userApi, instanceApi } from '@/lib/api';

interface UserProfile {
  _id?: string;
  username: string;
  fullName?: string;
  email?: string;
  role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [reportingStatus, setReportingStatus] = useState<{
    usageReportingEnabled: boolean;
    hasAdminUrl: boolean;
    hasInstanceApiKey: boolean;
  } | null>(null);

  const [testInProgress, setTestInProgress] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await authApi.me();
        setProfile(data);
        setFormData({ fullName: data.fullName || '', email: data.email || '' });
      } catch (err) {
        // Profile load failed - show error state
        setErrorMessage('Failed to load profile. Please try logging in again.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();

    async function loadReporting() {
      try {
        const status = await instanceApi.getStatus();
        setReportingStatus(status);
      } catch (err) {
        // ignore - non-critical
        setReportingStatus(null);
      }
    }
    loadReporting();
  }, []);

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(formData);
      setProfile((prev) => (prev ? { ...prev, ...updated } : null));
      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      showMessage(
        'error',
        (err as Error).message || 'Failed to update profile',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await userApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showMessage('success', 'Password changed successfully!');
    } catch (err) {
      showMessage(
        'error',
        'Failed to change password. Please check your current password.',
      );
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* Profile Header */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile?.fullName
                ? profile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {profile?.fullName || profile?.username}
              </h3>
              <p className="text-muted-foreground">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                {{
                  super_admin: 'Super Admin',
                  client_admin: 'Client Admin',
                  manager: 'Manager',
                  qa_analyst: 'QA Analyst',
                  auditor: 'Auditor',
                  agent: 'Agent',
                }[profile?.role as string] || profile?.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Username cannot be changed
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Usage Reporting Status */}
              <div className="pt-2">
                <label className="text-sm font-medium">Usage Reporting</label>
                <div className="mt-1 space-y-2">
                  {reportingStatus === null ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking
                      status...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        {reportingStatus.hasAdminUrl ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" /> Admin URL
                            configured
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" /> Admin URL not
                            configured
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {reportingStatus.hasInstanceApiKey ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" /> API key
                            configured
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" /> API key not
                            configured
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {reportingStatus.usageReportingEnabled ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" /> Reporting
                            enabled
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" /> Reporting
                            disabled
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable reporting to send anonymized usage to the admin panel.
                  See{' '}
                  <a className="underline" href="/docs/DEPLOYMENT.md">
                    docs
                  </a>{' '}
                  for setup.
                </p>

                {/* Test report */}
                <div className="mt-3">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-border text-sm bg-background hover:bg-muted"
                    onClick={async () => {
                      setTestInProgress(true);
                      setTestResult(null);
                      try {
                        const res = await instanceApi.sendTestReport();
                        setTestResult({
                          success: res.success,
                          message: res.message,
                        });
                      } catch (err) {
                        setTestResult({
                          success: false,
                          message:
                            (err as Error).message ||
                            'Failed to send test report',
                        });
                      } finally {
                        setTestInProgress(false);
                      }
                    }}
                    disabled={testInProgress}
                  >
                    {testInProgress ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send test report'
                    )}
                  </button>
                  {testResult && (
                    <div
                      className={`mt-2 text-sm ${testResult.success ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {testResult.message ||
                        (testResult.success
                          ? 'Test report sent'
                          : 'Failed to send test report')}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={changingPassword}
              >
                {changingPassword && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
