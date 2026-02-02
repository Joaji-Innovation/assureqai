'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Users, FileText, Search, AlertTriangle, TrendingUp, TrendingDown, Server, Key, Copy, RefreshCw, Check, CreditCard } from 'lucide-react';
import api, { Instance } from '@/lib/api';

interface UsageData {
  instanceId: string;
  clientId: string;
  clientName: string;
  plan: 'trial' | 'standard' | 'enterprise';
  billingType: 'prepaid' | 'postpaid';
  apiKey?: string;
  users: { current: number; limit: number | 'unlimited' };
  audits: { current: number; limit: number | 'unlimited' };
  storage: { current: number; limit: number };
  apiCalls: number;
  trend: 'up' | 'down' | 'stable';
}

export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const instances = await api.instance.findAll();
      const mappedData: UsageData[] = instances.map((inst: Instance) => ({
        instanceId: inst._id,
        clientId: inst.clientId || '',
        clientName: inst.name || 'Unknown',
        plan: (inst.plan as any) || 'trial',
        billingType: inst.credits?.billingType || 'prepaid',
        apiKey: inst.apiKey,
        users: {
          current: Math.floor(Math.random() * 20), // Simulated current usage
          limit: inst.limits?.maxUsers || (inst.plan === 'enterprise' ? 'unlimited' : 50)
        },
        audits: {
          current: inst.credits?.usedAudits || 0,
          limit: inst.credits?.totalAudits || 'unlimited'
        },
        storage: {
          current: Math.floor(Math.random() * 5), // Simulated storage usage
          limit: parseInt(inst.limits?.maxStorage || '10')
        },
        apiCalls: inst.credits?.totalApiCalls || 0,
        trend: 'stable' // Hardcoded for now
      }));
      setUsageData(mappedData);
    } catch (error) {
      console.error('Failed to fetch usage', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = usageData.filter(data => {
    const matchesSearch = data.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || data.plan === planFilter;
    const matchesBilling = billingFilter === 'all' || data.billingType === billingFilter;
    return matchesSearch && matchesPlan && matchesBilling;
  });

  const getUsagePercent = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500/10 text-purple-500';
      case 'standard': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBillingColor = (billingType: string) => {
    return billingType === 'postpaid'
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-emerald-500/10 text-emerald-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <span className="text-muted-foreground">—</span>;
    }
  };

  const copyApiKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const regenerateApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) return;

    setRegeneratingId(id);
    try {
      const result = await api.instance.regenerateApiKey(id);
      setUsageData(prev => prev.map(d =>
        d.instanceId === id ? { ...d, apiKey: result.apiKey } : d
      ));
    } catch (error) {
      console.error('Failed to regenerate API key', error);
      alert('Failed to regenerate API key');
    } finally {
      setRegeneratingId(null);
    }
  };

  const updateBillingType = async (id: string, newType: 'prepaid' | 'postpaid') => {
    try {
      await api.instance.updateBillingType(id, newType);
      setUsageData(prev => prev.map(d =>
        d.instanceId === id ? { ...d, billingType: newType } : d
      ));
    } catch (error) {
      console.error('Failed to update billing type', error);
      alert('Failed to update billing type');
    }
  };

  // Platform totals
  const totals = {
    users: usageData.reduce((sum, d) => sum + d.users.current, 0),
    audits: usageData.reduce((sum, d) => sum + d.audits.current, 0),
    storage: usageData.reduce((sum, d) => sum + d.storage.current, 0),
    apiCalls: usageData.reduce((sum, d) => sum + d.apiCalls, 0),
  };

  // Clients approaching limits
  const atRiskClients = usageData.filter(d => {
    const auditsPercent = d.audits.limit !== 'unlimited' ? getUsagePercent(d.audits.current, d.audits.limit) : 0;
    const usersPercent = d.users.limit !== 'unlimited' ? getUsagePercent(d.users.current, d.users.limit) : 0;
    return auditsPercent >= 80 || usersPercent >= 80;
  });

  const maskApiKey = (key: string) => {
    if (!key) return '—';
    return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage & API Keys</h2>
          <p className="text-muted-foreground">Monitor client resource consumption and manage API keys</p>
        </div>
      </div>

      {/* Platform Totals */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totals.users.toLocaleString()} />
        <StatCard icon={FileText} label="Total Audits" value={totals.audits.toLocaleString()} />
        <StatCard icon={Server} label="Storage Used" value={`${totals.storage} GB`} />
        <StatCard icon={BarChart2} label="API Calls" value={`${(totals.apiCalls / 1000).toFixed(0)}k`} />
      </div>

      {/* At-Risk Clients Alert */}
      {atRiskClients.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-amber-500">{atRiskClients.length} clients approaching limits</p>
            <p className="text-sm text-muted-foreground">
              {atRiskClients.map(c => c.clientName).join(', ')} may need plan upgrades.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Plans</option>
          <option value="trial">Trial</option>
          <option value="standard">Standard</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={billingFilter}
          onChange={(e) => setBillingFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Billing Types</option>
          <option value="prepaid">Prepaid</option>
          <option value="postpaid">Postpaid</option>
        </select>
      </div>

      {/* Usage Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Plan</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Billing</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Audits</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">API Calls</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">API Key</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((data) => {
              const auditPercent = getUsagePercent(data.audits.current, data.audits.limit);

              return (
                <tr key={data.instanceId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{data.clientName}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(data.plan)}`}>
                      {data.plan}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <select
                      value={data.billingType}
                      onChange={(e) => updateBillingType(data.instanceId, e.target.value as 'prepaid' | 'postpaid')}
                      className={`px-2 py-1 text-xs rounded-full cursor-pointer border-0 ${getBillingColor(data.billingType)}`}
                    >
                      <option value="prepaid">Prepaid</option>
                      <option value="postpaid">Postpaid</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <UsageBar
                      current={data.audits.current}
                      limit={data.audits.limit}
                      percent={auditPercent}
                      getUsageColor={getUsageColor}
                    />
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-sm font-medium">{data.apiCalls.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {maskApiKey(data.apiKey || '')}
                      </code>
                      {data.apiKey && (
                        <>
                          <button
                            onClick={() => copyApiKey(data.apiKey!, data.instanceId)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy API Key"
                          >
                            {copiedKey === data.instanceId ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => regenerateApiKey(data.instanceId)}
                            disabled={regeneratingId === data.instanceId}
                            className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                            title="Regenerate API Key"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${regeneratingId === data.instanceId ? 'animate-spin' : ''}`} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{getTrendIcon(data.trend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ current, limit, percent, getUsageColor, suffix = '' }: {
  current: number;
  limit: number | 'unlimited';
  percent: number;
  getUsageColor: (p: number) => string;
  suffix?: string;
}) {
  if (limit === 'unlimited') {
    return (
      <div className="text-center">
        <span className="text-sm">{current.toLocaleString()}{suffix}</span>
        <span className="text-xs text-muted-foreground ml-1">/ ∞</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{current.toLocaleString()}{suffix}</span>
        <span className="text-muted-foreground">/ {limit.toLocaleString()}{suffix}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${getUsageColor(percent)}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
