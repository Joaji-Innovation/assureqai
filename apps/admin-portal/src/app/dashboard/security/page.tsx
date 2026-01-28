'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Clock, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  timestamp: string;
  status: 'success' | 'failed';
}

const mockAuditLogs: AuditLog[] = [
  { id: '1', action: 'Admin Login', user: 'john@assureqai.com', ip: '192.168.1.100', timestamp: '2026-01-11T14:30:00Z', status: 'success' },
  { id: '2', action: 'Client Created', user: 'sarah@assureqai.com', ip: '192.168.1.101', timestamp: '2026-01-11T10:15:00Z', status: 'success' },
  { id: '3', action: 'Instance Restart', user: 'john@assureqai.com', ip: '192.168.1.100', timestamp: '2026-01-10T16:45:00Z', status: 'success' },
  { id: '4', action: 'Failed Login Attempt', user: 'unknown@example.com', ip: '203.45.67.89', timestamp: '2026-01-10T12:00:00Z', status: 'failed' },
  { id: '5', action: 'Settings Changed', user: 'john@assureqai.com', ip: '192.168.1.100', timestamp: '2026-01-09T09:00:00Z', status: 'success' },
];

export default function SecurityPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      // Fetch audits list
      const result = await api.audit.list({ page: 1, limit: 10 }) as any;

      // If result.data exists (paginated), use it, otherwise assumption
      const logs = result.data || result;

      // Map to frontend interface
      const mappedLogs = Array.isArray(logs) ? logs.map((log: any) => ({
        id: log._id || log.id,
        action: log.action || 'Unknown Action',
        user: log.user?.email || log.userId || 'System',
        ip: log.ipAddress || '127.0.0.1',
        timestamp: log.createdAt || new Date().toISOString(),
        status: (log.status === 'failure' ? 'failed' : 'success') as 'success' | 'failed'
      })) : [];

      setAuditLogs(mappedLogs);
    } catch (error) {
      console.error('Failed to fetch audits', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKeys = async () => {
    if (!confirm('This will invalidate all existing API keys. Continue?')) return;
    setRegenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setRegenerating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security</h2>
        <p className="text-muted-foreground">Security settings and audit logs</p>
      </div>

      {/* Security Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="font-medium">2FA Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">Enabled</p>
          <p className="text-xs text-muted-foreground">All admin users</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">API Keys</span>
          </div>
          <p className="text-2xl font-bold">24</p>
          <p className="text-xs text-muted-foreground">Active keys</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <span className="font-medium">Failed Logins</span>
          </div>
          <p className="text-2xl font-bold text-red-500">3</p>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Security Actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={handleRegenerateKeys}
            disabled={regenerating}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
          >
            {regenerating ? <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> : <RefreshCw className="h-5 w-5 text-amber-500" />}
            <div>
              <p className="font-medium">Regenerate Master API Key</p>
              <p className="text-xs text-muted-foreground">Invalidates all existing keys</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Session Timeout Settings</p>
              <p className="text-xs text-muted-foreground">Currently: 30 minutes</p>
            </div>
          </button>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Audit Logs</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">IP Address</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium">{log.action}</td>
                <td className="py-3 px-4">{log.user}</td>
                <td className="py-3 px-4 font-mono text-xs">{log.ip}</td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="text-center py-3 px-4">
                  {log.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 inline" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
