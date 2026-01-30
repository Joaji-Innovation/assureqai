'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Webhook, Settings, Plus, Trash2, Loader2, Send, ToggleLeft, ToggleRight, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
} from '@/lib/hooks';

export default function NotificationsPage() {
  const { data: settings, isLoading: settingsLoading } = useNotificationSettings();
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhooks();
  const updateSettings = useUpdateNotificationSettings();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] });
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const toggleRule = (type: string) => {
    if (!settings?.alertRules) return;
    const updatedRules = settings.alertRules.map(rule =>
      rule.type === type ? { ...rule, enabled: !rule.enabled } : rule
    );
    updateSettings.mutate({ alertRules: updatedRules });
  };

  const toggleWebhookActive = (id: string, active: boolean) => {
    updateWebhook.mutate({ id, data: { active: !active } });
  };

  const handleTestWebhook = async (id: string) => {
    setTestResult(null);
    const result = await testWebhook.mutateAsync(id);
    setTestResult({ id, ...result });
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteWebhook.mutate(id);
    }
  };

  const handleAddWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) return;
    createWebhook.mutate(newWebhook, {
      onSuccess: () => {
        setNewWebhook({ name: '', url: '', events: [] });
        setShowAddWebhook(false);
      },
    });
  };

  const addEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    const emails = settings?.alertRecipientEmails || [];
    if (emails.includes(newEmail)) return;
    updateSettings.mutate({ alertRecipientEmails: [...emails, newEmail] });
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    const emails = settings?.alertRecipientEmails || [];
    updateSettings.mutate({ alertRecipientEmails: emails.filter(e => e !== email) });
  };

  const eventTypes = [
    { value: 'fatal_failure', label: 'Fatal Failure' },
    { value: 'threshold_breach', label: 'Threshold Breach' },
    { value: 'at_risk', label: 'At-Risk Agent' },
    { value: 'compliance', label: 'Compliance Violation' },
    { value: 'low_score', label: 'Low Score' },
  ];

  const isLoading = settingsLoading || webhooksLoading;

  if (isLoading) {
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
          <h2 className="text-2xl font-bold tracking-tight">Real-time Alerts</h2>
          <p className="text-muted-foreground">Configure notifications and integrations</p>
        </div>
        {updateSettings.isPending && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        )}
      </div>

      {/* Alert Rules */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settings?.alertRules && settings.alertRules.length > 0 ? (
            <div className="space-y-3">
              {settings.alertRules.map((rule) => (
                <div key={rule.type} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${rule.enabled ? 'border-border' : 'border-border/50 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleRule(rule.type)} disabled={updateSettings.isPending}>
                      {rule.enabled ? (
                        <ToggleRight className="h-6 w-6 text-primary" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <p className="font-medium capitalize">{rule.type.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {rule.channels.includes('push') && (
                          <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">Push</span>
                        )}
                        {rule.channels.includes('email') && (
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-500">Email</span>
                        )}
                        {rule.channels.includes('webhook') && (
                          <span className="px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-500">Webhook</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alert rules configured yet.</p>
              <p className="text-sm">Alert rules will be created automatically when you save settings.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Recipients */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Recipients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Add email addresses that should receive alert notifications. These recipients will be notified when alerts are triggered.
          </p>

          {/* Add Email */}
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter email address..."
            />
            <Button onClick={addEmail} disabled={!newEmail || updateSettings.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Email List */}
          <div className="space-y-2">
            {settings?.alertRecipientEmails && settings.alertRecipientEmails.length > 0 ? (
              settings.alertRecipientEmails.map((email) => (
                <div key={email} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    onClick={() => removeEmail(email)}
                    disabled={updateSettings.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No email recipients added yet.</p>
                <p className="text-xs">Add an email address above to receive alert notifications.</p>
              </div>
            )}
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => updateSettings.mutate({ emailNotificationsEnabled: !settings?.emailNotificationsEnabled })}
              disabled={updateSettings.isPending}
            >
              {settings?.emailNotificationsEnabled ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <span className="text-sm">
              Email notifications {settings?.emailNotificationsEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Integrations
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddWebhook(!showAddWebhook)}>
            {showAddWebhook ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showAddWebhook ? 'Cancel' : 'Add Webhook'}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add Webhook Form */}
          {showAddWebhook && (
            <div className="mb-6 p-4 rounded-lg border border-primary/50 bg-primary/5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Slack Alerts"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Webhook URL</label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://hooks.example.com/..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Events</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventTypes.map((event) => (
                      <button
                        key={event.value}
                        onClick={() => {
                          const events = newWebhook.events.includes(event.value)
                            ? newWebhook.events.filter(e => e !== event.value)
                            : [...newWebhook.events, event.value];
                          setNewWebhook({ ...newWebhook, events });
                        }}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${newWebhook.events.includes(event.value)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        {event.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                className="mt-4"
                onClick={handleAddWebhook}
                disabled={createWebhook.isPending || !newWebhook.name || !newWebhook.url}
              >
                {createWebhook.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Webhook
              </Button>
            </div>
          )}

          {/* Webhook List */}
          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhooks configured yet.</p>
                <p className="text-sm">Add a webhook to receive real-time alerts in Slack, Teams, or any other service.</p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook._id} className={`p-4 rounded-lg border transition-colors ${webhook.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleWebhookActive(webhook._id, webhook.active)} disabled={updateWebhook.isPending}>
                        {webhook.active ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                      <div>
                        <p className="font-medium">{webhook.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">{webhook.url}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {webhook.events.map((event) => (
                            <span key={event} className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                              {event.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult?.id === webhook._id && (
                        <span className={`flex items-center gap-1 text-xs ${testResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                          {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {testResult.message}
                        </span>
                      )}
                      {webhook.lastTriggered && (
                        <span className="text-xs text-muted-foreground">
                          Last: {new Date(webhook.lastTriggered).toLocaleDateString()}
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook._id)}
                        disabled={testWebhook.isPending}
                      >
                        {testWebhook.isPending && testWebhook.variables === webhook._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteWebhook(webhook._id)}
                        disabled={deleteWebhook.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
