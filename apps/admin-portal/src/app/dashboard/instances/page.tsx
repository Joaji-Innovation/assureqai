'use client';

import { useState, useEffect } from 'react';
import { Server, Search, Play, Square, RefreshCw, Settings, ExternalLink, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { instanceApi, Instance } from '@/lib/api';

export default function InstancesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const data = await instanceApi.findAll();
      setInstances(data);
    } catch (error) {
      console.error('Failed to fetch instances', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = (instance.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      instance._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInstanceAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(id);
    try {
      if (action === 'start') await instanceApi.start(id);
      if (action === 'stop') await instanceApi.stop(id);
      if (action === 'restart') await instanceApi.restart(id);

      // Optimistic update (or refetch)
      setInstances(prev => prev.map(inst => {
        if (inst._id === id) {
          if (action === 'stop') return { ...inst, status: 'stopped' };
          if (action === 'start' || action === 'restart') return { ...inst, status: 'running' };
        }
        return inst;
      }));
    } catch (error) {
      console.error(`Failed to ${action} instance`, error);
      alert(`Failed to ${action} instance`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-emerald-500/10 text-emerald-500';
      case 'stopped': return 'bg-muted text-muted-foreground';
      case 'provisioning': return 'bg-blue-500/10 text-blue-500';
      case 'error': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'provisioning': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instance Management</h2>
          <p className="text-muted-foreground">Monitor and manage client instances</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {instances.filter(i => i.status === 'running').length} / {instances.length} running
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search instances..."
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
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="provisioning">Provisioning</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Instances Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInstances.map((instance) => (
            <div key={instance._id} className="bg-card/50 backdrop-blur rounded-xl border border-border p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${instance.status === 'running' ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <Server className={`h-5 w-5 ${instance.status === 'running' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-mono text-sm line-clamp-1 w-24" title={instance._id}>{instance._id}</p>
                    <p className="text-xs text-muted-foreground">{instance.region || 'us-east-1'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(instance.status)}`}>
                  {getStatusIcon(instance.status)}
                  {instance.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="font-medium">{instance.name || 'Unnamed Instance'}</p>
                {instance.domain?.subdomain && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {instance.domain.customDomain || `${instance.domain.subdomain}.assureqai.app`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Version: {instance.version || 'v2.4.0'}</p>
              </div>

              {instance.status === 'running' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">CPU</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${(instance.cpu || 0) > 80 ? 'bg-red-500' : (instance.cpu || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${instance.cpu || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium">{instance.cpu || 0}%</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${(instance.memory || 0) > 80 ? 'bg-red-500' : (instance.memory || 0) > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${instance.memory || 0}%` }} />
                      </div>
                      <span className="text-xs font-medium">{instance.memory || 0}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {instance.status === 'running' ? (
                  <>
                    <button
                      onClick={() => handleInstanceAction(instance._id, 'stop')}
                      disabled={actionLoading === instance._id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {actionLoading === instance._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                      Stop
                    </button>
                    <button
                      onClick={() => handleInstanceAction(instance._id, 'restart')}
                      disabled={actionLoading === instance._id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Restart
                    </button>
                  </>
                ) : instance.status === 'stopped' ? (
                  <button
                    onClick={() => handleInstanceAction(instance._id, 'start')}
                    disabled={actionLoading === instance._id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === instance._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Start
                  </button>
                ) : null}
                <button
                  onClick={() => window.location.href = `/dashboard/instances/${instance._id}`}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  title="Configure Instance"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!loading && filteredInstances.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No instances found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
