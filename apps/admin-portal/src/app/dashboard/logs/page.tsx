'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Terminal,
  Server,
} from 'lucide-react';
import api from '@/lib/api';

interface DeployLog {
  id: string;
  instanceId: string;
  instanceName: string;
  action: 'deploy' | 'update' | 'restart' | 'stop';
  status: 'success' | 'failed' | 'in_progress';
  logs: string[];
  duration?: number;
  error?: string;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<DeployLog | null>(null);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const instances = await api.instance.findAll();
      const logPromises = instances.map(async (inst: any) => {
        try {
          return await api.instance.getLogs(inst._id);
        } catch (e) {
          return [];
        }
      });
      const results = await Promise.all(logPromises);
      const allLogs = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch = l.instanceName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'deploy':
        return 'bg-primary/10 text-primary';
      case 'update':
        return 'bg-blue-500/10 text-blue-500';
      case 'restart':
        return 'bg-amber-500/10 text-amber-500';
      case 'stop':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deployment Logs</h2>
          <p className="text-muted-foreground">
            SSH deployment history and logs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Actions</option>
          <option value="deploy">Deploy</option>
          <option value="update">Update</option>
          <option value="restart">Restart</option>
          <option value="stop">Stop</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`bg-card/50 backdrop-blur rounded-xl border p-5 cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'border-primary' : 'border-border hover:border-primary/50'}`}
            onClick={() =>
              setSelectedLog(selectedLog?.id === log.id ? null : log)
            }
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{log.instanceName}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    {log.duration && (
                      <span>{(log.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(log.status)}`}
              >
                {getStatusIcon(log.status)}
                {log.status}
              </span>
            </div>

            {log.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm mb-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {log.error}
              </div>
            )}

            {selectedLog?.id === log.id && (
              <div className="mt-4 p-4 rounded-lg bg-black/50 font-mono text-xs overflow-x-auto">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span>Deployment Log</span>
                </div>
                {log.logs.map((line, i) => (
                  <div
                    key={i}
                    className={`${line.includes('ERROR') ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
