'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Users, FileText, Search, AlertTriangle, TrendingUp, TrendingDown, Server } from 'lucide-react';
import api from '@/lib/api';

interface UsageData {
  clientId: string;
  clientName: string;
  plan: 'starter' | 'pro' | 'enterprise';
  users: { current: number; limit: number | 'unlimited' };
  audits: { current: number; limit: number | 'unlimited' };
  storage: { current: number; limit: number };
  apiCalls: { current: number; limit: number | 'unlimited' };
  trend: 'up' | 'down' | 'stable';
}

const mockUsageData: UsageData[] = [
  { clientId: '1', clientName: 'Acme Corporation', plan: 'enterprise', users: { current: 156, limit: 'unlimited' }, audits: { current: 4521, limit: 'unlimited' }, storage: { current: 45, limit: 100 }, apiCalls: { current: 125000, limit: 'unlimited' }, trend: 'up' },
  { clientId: '2', clientName: 'TechFlow Inc', plan: 'pro', users: { current: 45, limit: 100 }, audits: { current: 3234, limit: 5000 }, storage: { current: 12, limit: 50 }, apiCalls: { current: 45000, limit: 100000 }, trend: 'up' },
  { clientId: '4', clientName: 'CloudNine Solutions', plan: 'pro', users: { current: 78, limit: 100 }, audits: { current: 4156, limit: 5000 }, storage: { current: 38, limit: 50 }, apiCalls: { current: 78000, limit: 100000 }, trend: 'stable' },
  { clientId: '5', clientName: 'NexGen Labs', plan: 'enterprise', users: { current: 234, limit: 'unlimited' }, audits: { current: 8934, limit: 'unlimited' }, storage: { current: 78, limit: 200 }, apiCalls: { current: 234000, limit: 'unlimited' }, trend: 'up' },
  { clientId: '3', clientName: 'DataVerse', plan: 'starter', users: { current: 12, limit: 15 }, audits: { current: 423, limit: 500 }, storage: { current: 4, limit: 10 }, apiCalls: { current: 8500, limit: 10000 }, trend: 'down' },
  { clientId: '6', clientName: 'StartupX', plan: 'starter', users: { current: 8, limit: 15 }, audits: { current: 0, limit: 500 }, storage: { current: 1, limit: 10 }, apiCalls: { current: 0, limit: 10000 }, trend: 'stable' },
];

export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const instances = await api.instance.findAll();
      const mappedData: UsageData[] = instances.map((inst: any) => ({
        clientId: inst.clientId,
        clientName: inst.name,
        plan: inst.plan || 'starter',
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
        apiCalls: {
          current: inst.credits?.usedTokens || 0,
          limit: inst.credits?.totalTokens || 'unlimited'
        },
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
    return matchesSearch && matchesPlan;
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
      case 'pro': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <span className="text-muted-foreground">—</span>;
    }
  };

  // Platform totals
  const totals = {
    users: usageData.reduce((sum, d) => sum + d.users.current, 0),
    audits: usageData.reduce((sum, d) => sum + d.audits.current, 0),
    storage: usageData.reduce((sum, d) => sum + d.storage.current, 0),
    apiCalls: usageData.reduce((sum, d) => sum + d.apiCalls.current, 0),
  };

  // Clients approaching limits
  const atRiskClients = usageData.filter(d => {
    const auditsPercent = d.audits.limit !== 'unlimited' ? getUsagePercent(d.audits.current, d.audits.limit) : 0;
    const usersPercent = d.users.limit !== 'unlimited' ? getUsagePercent(d.users.current, d.users.limit) : 0;
    return auditsPercent >= 80 || usersPercent >= 80;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage & Limits</h2>
          <p className="text-muted-foreground">Monitor client resource consumption</p>
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
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Usage Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Plan</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Users</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Audits</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Storage</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((data) => {
              const userPercent = getUsagePercent(data.users.current, data.users.limit);
              const auditPercent = getUsagePercent(data.audits.current, data.audits.limit);
              const storagePercent = getUsagePercent(data.storage.current, data.storage.limit);

              return (
                <tr key={data.clientId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{data.clientName}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(data.plan)}`}>
                      {data.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <UsageBar
                      current={data.users.current}
                      limit={data.users.limit}
                      percent={userPercent}
                      getUsageColor={getUsageColor}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <UsageBar
                      current={data.audits.current}
                      limit={data.audits.limit}
                      percent={auditPercent}
                      getUsageColor={getUsageColor}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <UsageBar
                      current={data.storage.current}
                      limit={data.storage.limit}
                      percent={storagePercent}
                      getUsageColor={getUsageColor}
                      suffix="GB"
                    />
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
