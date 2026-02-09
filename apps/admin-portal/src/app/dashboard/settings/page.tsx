'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader2,
  Database,
  Mail,
  Shield,
  Bell,
  Globe,
  CheckCircle,
  XCircle,
  Wifi,
} from 'lucide-react';

import { settingsApi, healthApi } from '@/lib/api';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultPlan: string;
  trialDays: number;
  enableSignups: boolean;
  requireEmailVerification: boolean;
  maxAuditsPerMinute: number;
  defaultAuditLanguage: string;
  retentionDays: number;
  backupEnabled: boolean;
  backupSchedule: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'AssureQai',
    supportEmail: 'support@assureqai.com',
    defaultPlan: 'starter',
    trialDays: 14,
    enableSignups: true,
    requireEmailVerification: true,
    maxAuditsPerMinute: 10,
    defaultAuditLanguage: 'auto',
    retentionDays: 365,
    backupEnabled: true,
    backupSchedule: 'daily',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      // Merge with default/existing state to prevent nulls if API returns partial data
      if (data)
        setSettings((prev) => ({
          ...prev,
          ...(data as Partial<PlatformSettings>),
        }));
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const conn = await healthApi.connectivity();
      const smtpStatus = conn.services.smtp;
      setSmtpTestResult({
        success: smtpStatus.status === 'connected',
        message: smtpStatus.message,
      });
    } catch (error: any) {
      setSmtpTestResult({
        success: false,
        message: error?.message || 'Failed to check SMTP connectivity',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-muted-foreground">
            Configure global platform settings
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <SettingsSection icon={Globe} title="General">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Platform Name</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Plan</label>
            <select
              value={settings.defaultPlan}
              onChange={(e) =>
                setSettings({ ...settings, defaultPlan: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Trial Period (days)</label>
            <input
              type="number"
              value={settings.trialDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  trialDays: parseInt(e.target.value),
                })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection icon={Shield} title="Security">
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <div>
              <p className="font-medium">Enable Public Signups</p>
              <p className="text-xs text-muted-foreground">
                Allow new clients to register
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSignups}
              onChange={(e) =>
                setSettings({ ...settings, enableSignups: e.target.checked })
              }
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <div>
              <p className="font-medium">Require Email Verification</p>
              <p className="text-xs text-muted-foreground">
                Users must verify email before access
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  requireEmailVerification: e.target.checked,
                })
              }
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <div>
            <label className="text-sm font-medium">
              Max Audits Per Minute (Rate Limit)
            </label>
            <input
              type="number"
              value={settings.maxAuditsPerMinute}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxAuditsPerMinute: parseInt(e.target.value),
                })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Data Settings */}
      <SettingsSection icon={Database} title="Data & Backups">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Data Retention (days)</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retentionDays: parseInt(e.target.value),
                })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <div>
              <p className="font-medium">Automatic Backups</p>
              <p className="text-xs text-muted-foreground">
                Regular database backups
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.backupEnabled}
              onChange={(e) =>
                setSettings({ ...settings, backupEnabled: e.target.checked })
              }
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <div>
            <label className="text-sm font-medium">Backup Schedule</label>
            <select
              value={settings.backupSchedule}
              onChange={(e) =>
                setSettings({ ...settings, backupSchedule: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      {/* Email Settings */}
      <SettingsSection icon={Mail} title="Email (SMTP)">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">SMTP Host</label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) =>
                setSettings({ ...settings, smtpHost: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Port</label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) =>
                setSettings({ ...settings, smtpPort: parseInt(e.target.value) })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) =>
                setSettings({ ...settings, smtpUser: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleTestSmtp}
            disabled={smtpTesting}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-primary/5 hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {smtpTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            Test SMTP Connection
          </button>
          {smtpTestResult && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                smtpTestResult.success
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {smtpTestResult.success ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="break-words">{smtpTestResult.message}</span>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}
