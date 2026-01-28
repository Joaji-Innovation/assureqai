'use client';

import { useState } from 'react';
import { Settings, Save, Loader2, Database, Mail, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
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
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpUser: 'apikey',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-muted-foreground">Configure global platform settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Plan</label>
            <select
              value={settings.defaultPlan}
              onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
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
              onChange={(e) => setSettings({ ...settings, trialDays: parseInt(e.target.value) })}
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
              <p className="text-xs text-muted-foreground">Allow new clients to register</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSignups}
              onChange={(e) => setSettings({ ...settings, enableSignups: e.target.checked })}
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <div>
              <p className="font-medium">Require Email Verification</p>
              <p className="text-xs text-muted-foreground">Users must verify email before access</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <div>
            <label className="text-sm font-medium">Max Audits Per Minute (Rate Limit)</label>
            <input
              type="number"
              value={settings.maxAuditsPerMinute}
              onChange={(e) => setSettings({ ...settings, maxAuditsPerMinute: parseInt(e.target.value) })}
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
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
            <div>
              <p className="font-medium">Automatic Backups</p>
              <p className="text-xs text-muted-foreground">Regular database backups</p>
            </div>
            <input
              type="checkbox"
              checked={settings.backupEnabled}
              onChange={(e) => setSettings({ ...settings, backupEnabled: e.target.checked })}
              className="h-5 w-5 rounded accent-primary"
            />
          </label>
          <div>
            <label className="text-sm font-medium">Backup Schedule</label>
            <select
              value={settings.backupSchedule}
              onChange={(e) => setSettings({ ...settings, backupSchedule: e.target.value })}
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
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Port</label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
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
