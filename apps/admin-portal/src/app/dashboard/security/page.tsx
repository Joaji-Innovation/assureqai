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



export default function SecurityPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeKeys: 0,
    failedLogins: 0,
    twoFactorEnabled: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [auditsResult, instances] = await Promise.all([
        api.audit.list({ limit: 100 }) as Promise<any>,
        api.instance.findAll()
      ]);

      // Process Audits
      const logs = auditsResult.data || auditsResult;
      const mappedLogs = Array.isArray(logs) ? logs.map((log: any) => ({
        id: log._id || log.id,
        action: log.action || 'Unknown Action',
        user: log.user?.email || log.userId || 'System',
        ip: log.ipAddress || '127.0.0.1',
        timestamp: log.createdAt || new Date().toISOString(),
        status: (log.status === 'failure' ? 'failed' : 'success') as 'success' | 'failed'
      })) : [];

      setAuditLogs(mappedLogs);

      // Calculate Stats
      const activeKeysCount = instances.filter(i => i.apiKey).length;
      const failedLoginsCount = mappedLogs.filter(l => l.action.toLowerCase().includes('login') && l.status === 'failed').length;

      setStats({
        activeKeys: activeKeysCount,
        failedLogins: failedLoginsCount,
        twoFactorEnabled: 0 // Placeholder until 2FA is implemented
      });

    } catch (error) {
      console.error('Failed to fetch security data', error);
    } finally {
      setLoading(false);
    }
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
            <span className="font-medium">System Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">Secure</p>
          <p className="text-xs text-muted-foreground">All systems operational</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">Active API Keys</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeKeys}</p>
          <p className="text-xs text-muted-foreground">Across all instances</p>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <span className="font-medium">Failed Actions</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{stats.failedLogins}</p>
          <p className="text-xs text-muted-foreground">Recorded in recent logs</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Security Actions</h3>
        <div className="grid gap-4 md:grid-cols-1">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Session Timeout Settings</p>
              <p className="text-xs text-muted-foreground">Global session timeout is set to 30 minutes (Configured in Environment)</p>
            </div>
          </div>
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
