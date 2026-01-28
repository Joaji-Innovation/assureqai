'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Webhook, AlertTriangle, CheckCircle, Settings, Plus, Trash2, Loader2, Send, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertRule {
  id: string;
  name: string;
  type: 'fatal_failure' | 'threshold_breach' | 'at_risk' | 'compliance';
  enabled: boolean;
  channels: ('push' | 'email' | 'webhook')[];
  config: Record<string, unknown>;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
}

const mockAlertRules: AlertRule[] = [
  { id: '1', name: 'Fatal Parameter Failure', type: 'fatal_failure', enabled: true, channels: ['push', 'email', 'webhook'], config: {} },
  { id: '2', name: 'Agent Score Below 70%', type: 'threshold_breach', enabled: true, channels: ['push', 'email'], config: { threshold: 70 } },
  { id: '3', name: 'At-Risk Agent (3+ low scores)', type: 'at_risk', enabled: true, channels: ['email'], config: { consecutiveLow: 3 } },
  { id: '4', name: 'Compliance Phrase Detected', type: 'compliance', enabled: false, channels: ['push'], config: {} },
];

const mockWebhooks: WebhookConfig[] = [
  { id: '1', name: 'Slack Alerts', url: 'https://hooks.slack.com/services/xxx', events: ['fatal_failure', 'at_risk'], active: true, lastTriggered: '2026-01-10T14:30:00Z' },
  { id: '2', name: 'MS Teams', url: 'https://outlook.office.com/webhook/xxx', events: ['threshold_breach'], active: true },
];

export default function NotificationsPage() {
  const [alertRules, setAlertRules] = useState(mockAlertRules);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] });
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  
  // SMTP Config
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    user: 'alerts@assureqai.com',
    fromName: 'AssureQai Alerts',
    enabled: true,
  });

  const toggleRule = (id: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(wh => 
      wh.id === id ? { ...wh, active: !wh.active } : wh
    ));
  };

  const testWebhook = async (id: string) => {
    setTestingWebhook(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingWebhook(null);
  };

  const deleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(wh => wh.id !== id));
  };

  const addWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) return;
    setWebhooks(prev => [...prev, {
      id: Date.now().toString(),
      ...newWebhook,
      active: true,
    }]);
    setNewWebhook({ name: '', url: '', events: [] });
    setShowAddWebhook(false);
  };

  const eventTypes = [
    { value: 'fatal_failure', label: 'Fatal Failure' },
    { value: 'threshold_breach', label: 'Threshold Breach' },
    { value: 'at_risk', label: 'At-Risk Agent' },
    { value: 'compliance', label: 'Compliance Violation' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-time Alerts</h2>
          <p className="text-muted-foreground">Configure notifications and integrations</p>
        </div>
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
          <div className="space-y-3">
            {alertRules.map((rule) => (
              <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${rule.enabled ? 'border-border' : 'border-border/50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleRule(rule.id)}>
                    {rule.enabled ? (
                      <ToggleRight className="h-6 w-6 text-primary" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">{rule.name}</p>
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
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">SMTP Host</label>
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <input
                type="number"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">SMTP User</label>
              <input
                type="text"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">From Name</label>
              <input
                type="text"
                value={smtpConfig.fromName}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <button onClick={() => setSmtpConfig({ ...smtpConfig, enabled: !smtpConfig.enabled })}>
                {smtpConfig.enabled ? (
                  <ToggleRight className="h-6 w-6 text-primary" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <span className="text-sm">Email notifications {smtpConfig.enabled ? 'enabled' : 'disabled'}</span>
            </div>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
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
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          newWebhook.events.includes(event.value)
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
              <Button className="mt-4" onClick={addWebhook}>Add Webhook</Button>
            </div>
          )}

          {/* Webhook List */}
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className={`p-4 rounded-lg border transition-colors ${webhook.active ? 'border-border' : 'border-border/50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleWebhook(webhook.id)}>
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
                            {event.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {webhook.lastTriggered && (
                      <span className="text-xs text-muted-foreground">
                        Last: {new Date(webhook.lastTriggered).toLocaleDateString()}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={testingWebhook === webhook.id}
                    >
                      {testingWebhook === webhook.id ? (
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
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
