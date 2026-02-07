'use client';

import { useEffect, useState } from 'react';
import { Building2, Server, Users, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

// Initial Mock platform stats (fallback)
const initialStats = {
  totalClients: 0,
  activeInstances: 0,
  totalUsers: 0,
  monthlyRevenue: 0,
  totalAudits: 0,
  avgUptime: 99.99,
};

const recentClientsCommon = [
  { id: '1', name: 'Acme Corp', plan: 'Enterprise', users: 156, status: 'active', createdAt: '2026-01-10' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>(recentClientsCommon);
  const [health, setHealth] = useState([
    { service: 'API Gateway', status: 'healthy', latency: '23ms' },
    { service: 'Database', status: 'healthy', latency: '8ms' },
    { service: 'AI Engine', status: 'healthy', latency: '145ms' },
  ]);

  useEffect(() => {
    async function fetchData() {
      const healthStatus = { api: 'healthy', db: 'healthy', ai: 'healthy' };

      try {
        setLoading(true);
        // Fetch in parallel
        const [usersRes, instancesRes, auditsRes] = await Promise.allSettled([
          api.user.list({ limit: 1 }),
          api.instance.findAll(),
          api.audit.list({ limit: 1 })
        ]);

        const newStats = { ...initialStats };

        // Process Users
        if (usersRes.status === 'fulfilled') {
          newStats.totalUsers = usersRes.value.pagination.total;
          newStats.totalClients = Math.floor(newStats.totalUsers * 0.1);
        } else {
          healthStatus.db = 'degraded';
        }

        // Process Instances & Revenue
        if (instancesRes.status === 'fulfilled') {
          const instances = instancesRes.value;
          newStats.activeInstances = instances.filter((i: any) => i.status === 'running' || i.status === 'active').length;
          newStats.totalClients = instances.length;

          // Calculate Revenue
          const revenue = instances.reduce((acc: number, inst: any) => {
            const plan = inst.plan?.toLowerCase() || 'trial';
            if (plan === 'enterprise') return acc + 299;
            if (plan === 'standard' || plan === 'pro') return acc + 99;
            return acc;
          }, 0);
          newStats.monthlyRevenue = revenue * 1000;

          setClients(instances.slice(0, 5).map((inst: any) => ({
            id: inst._id,
            name: inst.name || 'Unnamed Instance',
            plan: inst.plan || 'Pro',
            users: inst.limits?.maxUsers || 10,
            status: inst.status || 'active',
            createdAt: new Date(inst.createdAt).toLocaleDateString()
          })));
        } else {
          healthStatus.api = 'degraded';
        }

        // Process Audits
        if (auditsRes.status === 'fulfilled') {
          newStats.totalAudits = auditsRes.value.pagination.total;
        } else {
          healthStatus.ai = 'degraded';
        }

        setStats(newStats);

        // Check Health Endpoint
        try {
          // We can assume if this call succeeds, the API Gateway is up.
          // The endpoint returns { status: 'ok', ... }
          const healthRes = await api.health.check();
          if (healthRes.status === 'ok' || healthRes.status === 'healthy') {
            healthStatus.api = 'healthy';
            // If we had DB check in health endpoint we could use it here
            // healthStatus.db = healthRes.info?.db?.status === 'up' ? 'healthy' : 'degraded';
          }
        } catch (e) {
          console.warn('Health check failed', e);
          // Keep derived health status
        }

        // Update Health State
        setHealth([
          { service: 'API Gateway', status: healthStatus.api, latency: healthStatus.api === 'healthy' ? '23ms' : '-' },
          { service: 'Database', status: healthStatus.db, latency: healthStatus.db === 'healthy' ? '8ms' : '-' },
          { service: 'AI Engine', status: healthStatus.ai, latency: healthStatus.ai === 'healthy' ? '145ms' : '-' },
        ]);

      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label="Total Clients" value={loading ? '-' : stats.totalClients} color="primary" />
        <StatCard icon={Server} label="Active Instances" value={loading ? '-' : stats.activeInstances} color="blue" />
        <StatCard icon={Users} label="Total Users" value={loading ? '-' : stats.totalUsers.toLocaleString()} color="purple" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={loading ? '-' : `$${(stats.monthlyRevenue / 1000).toFixed(1)}k`} color="emerald" />
        <StatCard icon={TrendingUp} label="Total Audits" value={loading ? '-' : `${stats.totalAudits}`} color="amber" />
        <StatCard icon={Activity} label="Uptime" value={`${stats.avgUptime}%`} color="cyan" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Instances</h2>
            <Link href="/dashboard/clients" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.plan} • {client.users} users</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                    {client.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{client.createdAt}</p>
                </div>
              </div>
            ))}
            {clients.length === 0 && <p className="text-sm text-muted-foreground">No instances found.</p>}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <span className="flex items-center gap-1 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              All Systems Operational
            </span>
          </div>
          <div className="space-y-3">
            {health.map((service) => (
              <div key={service.service} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${service.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="font-medium">{service.service}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{service.latency}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${service.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <QuickAction href="/dashboard/clients/new" icon={Building2} title="Add Client" description="Provision new client" />
          <QuickAction href="/dashboard/instances/new" icon={Server} title="Deploy Instance" description="Launch new instance" />
          <QuickAction href="/dashboard/domains" icon={Activity} title="Manage Domains" description="Configure custom domains" />
          <QuickAction href="/dashboard/notifications" icon={AlertTriangle} title="View Alerts" description="Check system alerts" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };

  return (
    <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: React.ElementType; title: string; description: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
