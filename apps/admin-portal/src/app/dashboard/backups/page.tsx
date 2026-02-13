'use client';

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Search,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface Backup {
  id: string;
  instanceId: string;
  instanceName: string;
  filename: string;
  sizeBytes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'manual' | 'scheduled' | 'auto';
  error?: string;
  createdAt: string;
  completedAt?: string;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const instances = await api.instance.findAll();
      const backupPromises = instances.map(async (inst: any) => {
        try {
          const backups = await api.backup.getByInstance(inst._id);
          // Map backend backup object to frontend interface if needed
          // Assuming backend returns array of objects similar to Backup interface
          return backups.map((b: any) => ({
            ...b,
            id: b._id,
            instanceName: inst.name, // Augment with instance name
            status: b.status || 'completed', // Fallback
            sizeBytes: b.size || 0,
            filename: b.filename || `backup-${b._id}`,
          }));
        } catch (e) {
          console.error(`Failed to fetch backups for ${inst.name}`, e);
          return [];
        }
      });

      const results = await Promise.all(backupPromises);
      const allBackups = results
        .flat()
        .sort(
          (a: Backup, b: Backup) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setBackups(allBackups);
    } catch (error) {
      console.error('Failed to fetch backups', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBackups = backups.filter((b) => {
    const matchesSearch =
      b.instanceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(restoreTarget);
    try {
      await api.backup.restore(restoreTarget);
      success('Backup restore initiated successfully!');
      fetchBackups(); // Refresh status
    } catch (error) {
      console.error('Restore failed', error);
      showError('Failed to restore backup');
    } finally {
      setRestoring(null);
      setRestoreTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget);
    try {
      await api.backup.delete(deleteTarget);
      setBackups((prev) => prev.filter((b) => b.id !== deleteTarget));
      success('Backup deleted successfully');
    } catch (error) {
      console.error('Delete failed', error);
      showError('Failed to delete backup');
    } finally {
      setDeleting(null);
      setDeleteTarget(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const stats = {
    totalBackups: backups.filter((b) => b.status === 'completed').length,
    totalSize: backups
      .filter((b) => b.status === 'completed')
      .reduce((a, b) => a + b.sizeBytes, 0),
    failed: backups.filter((b) => b.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backups</h2>
          <p className="text-muted-foreground">
            MongoDB backup and restore management
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Backups</p>
              <p className="text-2xl font-bold">{stats.totalBackups}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Download className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-2xl font-bold">
                {formatBytes(stats.totalSize)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-red-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search backups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Backups Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Instance
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                Filename
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                Size
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                Type
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                Created
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBackups.map((backup) => (
              <tr
                key={backup.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4">{backup.instanceName}</td>
                <td className="py-3 px-4">
                  <span className="font-mono text-xs">{backup.filename}</span>
                </td>
                <td className="text-center py-3 px-4">
                  {formatBytes(backup.sizeBytes)}
                </td>
                <td className="text-center py-3 px-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-muted">
                    {backup.type}
                  </span>
                </td>
                <td className="text-center py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(backup.status)}`}
                  >
                    {getStatusIcon(backup.status)}
                    {backup.status}
                  </span>
                </td>
                <td className="text-center py-3 px-4 text-muted-foreground">
                  {new Date(backup.createdAt).toLocaleDateString()}
                </td>
                <td className="text-right py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {backup.status === 'completed' && (
                      <button
                        onClick={() => setRestoreTarget(backup.id)}
                        disabled={restoring === backup.id}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Restore"
                      >
                        {restoring === backup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(backup.id)}
                      disabled={deleting === backup.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      {deleting === backup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Backup"
        description="Are you sure you want to restore this backup? This will overwrite current data."
        confirmLabel="Restore"
        variant="warning"
        loading={!!restoring}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Backup"
        description="Are you sure you want to delete this backup? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={!!deleting}
      />
    </div>
  );
}
