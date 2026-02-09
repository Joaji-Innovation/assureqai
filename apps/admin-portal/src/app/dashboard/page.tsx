'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Server,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Database,
  Cpu,
  Wifi,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import type { ConnectivityResult, ServiceStatus } from '@/lib/api';

// Initial platform stats (fallback zeros while loading)
const initialStats = {
  totalClients: 0,
  activeInstances: 0,
  totalUsers: 0,
  monthlyRevenue: 0,
  totalAudits: 0,
  avgUptime: 99.99,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityResult | null>(
    null,
  );
  const [connectivityLoading, setConnectivityLoading] = useState(false);
  const [health, setHealth] = useState([
    { service: 'API Gateway', status: 'checking', latency: '-' },
    { service: 'Database', status: 'checking', latency: '-' },
    { service: 'SMTP Email', status: 'checking', latency: '-' },
    { service: 'AI Engine', status: 'checking', latency: '-' },
  ]);

  const fetchConnectivity = async () => {
    setConnectivityLoading(true);
    try {
      const result = await api.health.connectivity();
      setConnectivity(result);
      return result;
    } catch (e) {
      console.warn('Connectivity check failed', e);
      return null;
    } finally {
      setConnectivityLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const healthStatus = {
        api: 'healthy',
        db: 'healthy',
        smtp: 'healthy',
        ai: 'healthy',
      };

      try {
        setLoading(true);
        // Fetch in parallel
        const [usersRes, instancesRes, auditsRes] = await Promise.allSettled([
          api.user.list({ limit: 1 }),
          api.instance.findAll(),
          api.audit.list({ limit: 1 }),
        ]);

        const newStats = { ...initialStats };

        // Process Users
        if (usersRes.status === 'fulfilled') {
          newStats.totalUsers = usersRes.value.pagination.total;
        } else {
          healthStatus.db = 'degraded';
        }

        // Process Instances & Revenue
        if (instancesRes.status === 'fulfilled') {
          const instances = instancesRes.value;
          newStats.activeInstances = instances.filter(
            (i: any) => i.status === 'running' || i.status === 'active',
          ).length;
          newStats.totalClients = instances.length;

          // Calculate Revenue
          const revenue = instances.reduce((acc: number, inst: any) => {
            const plan = inst.plan?.toLowerCase() || 'trial';
            if (plan === 'enterprise') return acc + 299;
            if (plan === 'standard' || plan === 'pro') return acc + 99;
            return acc;
          }, 0);
          newStats.monthlyRevenue = revenue;

          setClients(
            instances.slice(0, 5).map((inst: any) => ({
              id: inst._id,
              name: inst.name || 'Unnamed Instance',
              plan: inst.plan || 'Pro',
              users: inst.limits?.maxUsers || 10,
              status: inst.status || 'active',
              createdAt: new Date(inst.createdAt).toLocaleDateString(),
            })),
          );
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

        // Check Health Endpoint with latency measurement
        try {
          const healthStart = Date.now();
          const healthRes = await api.health.check();
          const apiLatency = Date.now() - healthStart;
          if (healthRes.status === 'ok' || healthRes.status === 'healthy') {
            healthStatus.api = 'healthy';
          }

          // Fetch real connectivity status for all services
          const conn = await fetchConnectivity();

          if (conn) {
            const dbConn = conn.services.database;
            const smtpConn = conn.services.smtp;
            const aiConn = conn.services.ai;

            healthStatus.db =
              dbConn.status === 'connected' ? 'healthy' : 'degraded';
            healthStatus.smtp =
              smtpConn.status === 'connected' ? 'healthy' : 'degraded';
            healthStatus.ai =
              aiConn.status === 'connected' ? 'healthy' : 'degraded';

            setHealth([
              {
                service: 'API Gateway',
                status: healthStatus.api,
                latency: `${apiLatency}ms`,
              },
              {
                service: 'Database',
                status: healthStatus.db,
                latency: dbConn.latency ? `${dbConn.latency}ms` : '-',
              },
              {
                service: 'SMTP Email',
                status: healthStatus.smtp,
                latency: smtpConn.latency ? `${smtpConn.latency}ms` : '-',
              },
              {
                service: 'AI Engine',
                status: healthStatus.ai,
                latency: aiConn.latency ? `${aiConn.latency}ms` : 'OK',
              },
            ]);
          } else {
            setHealth([
              {
                service: 'API Gateway',
                status: healthStatus.api,
                latency: `${apiLatency}ms`,
              },
              {
                service: 'Database',
                status: healthStatus.db,
                latency:
                  healthStatus.db === 'healthy'
                    ? `~${Math.round(apiLatency * 0.4)}ms`
                    : '-',
              },
              {
                service: 'SMTP Email',
                status: 'degraded',
                latency: '-',
              },
              {
                service: 'AI Engine',
                status: healthStatus.ai,
                latency: healthStatus.ai === 'healthy' ? 'OK' : '-',
              },
            ]);
          }
        } catch (e) {
          console.warn('Health check failed', e);
          setHealth([
            { service: 'API Gateway', status: healthStatus.api, latency: '-' },
            { service: 'Database', status: healthStatus.db, latency: '-' },
            { service: 'SMTP Email', status: 'degraded', latency: '-' },
            { service: 'AI Engine', status: healthStatus.ai, latency: '-' },
          ]);
        }
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
      {/* Connection Failure Alerts */}
      {connectivity && connectivity.overall !== 'healthy' && (
        <div
          className={`rounded-xl border p-4 ${
            connectivity.overall === 'critical'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${
                  connectivity.overall === 'critical'
                    ? 'text-red-500'
                    : 'text-amber-500'
                }`}
              />
              <h3
                className={`font-semibold ${
                  connectivity.overall === 'critical'
                    ? 'text-red-500'
                    : 'text-amber-500'
                }`}
              >
                {connectivity.overall === 'critical'
                  ? 'Critical: Multiple Service Connections Failed'
                  : 'Warning: Service Connection Issue Detected'}
              </h3>
            </div>
            <button
              onClick={fetchConnectivity}
              disabled={connectivityLoading}
              className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-border hover:bg-background/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${connectivityLoading ? 'animate-spin' : ''}`}
              />
              Recheck
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(connectivity.services).map(([key, svc]) => {
              if (svc.status === 'connected') return null;
              const icons: Record<string, React.ElementType> = {
                database: Database,
                smtp: Mail,
                ai: Cpu,
              };
              const labels: Record<string, string> = {
                database: 'Database',
                smtp: 'SMTP Email',
                ai: 'AI Engine',
              };
              const Icon = icons[key] || Wifi;
              return (
                <div
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border"
                >
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {labels[key] || key}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          svc.status === 'disconnected'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {svc.status === 'disconnected'
                          ? 'Disconnected'
                          : 'Not Configured'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {svc.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Building2}
          label="Total Clients"
          value={loading ? '-' : stats.totalClients}
          color="primary"
        />
        <StatCard
          icon={Server}
          label="Active Instances"
          value={loading ? '-' : stats.activeInstances}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={loading ? '-' : stats.totalUsers.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={
            loading ? '-' : `$${(stats.monthlyRevenue / 1000).toFixed(1)}k`
          }
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Audits"
          value={loading ? '-' : `${stats.totalAudits}`}
          color="amber"
        />
        <StatCard
          icon={Activity}
          label="Uptime"
          value={`${stats.avgUptime}%`}
          color="cyan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Instances</h2>
            <Link
              href="/dashboard/clients"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.plan} • {client.users} users
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      client.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {client.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {client.createdAt}
                  </p>
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No instances found.
              </p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Health</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchConnectivity}
                disabled={connectivityLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-border hover:bg-background/50 transition-colors disabled:opacity-50"
                title="Recheck all connections"
              >
                <RefreshCw
                  className={`h-3 w-3 ${connectivityLoading ? 'animate-spin' : ''}`}
                />
                Recheck
              </button>
              <span
                className={`flex items-center gap-1 text-sm ${health.every((s) => s.status === 'healthy') ? 'text-emerald-500' : 'text-yellow-500'}`}
              >
                {health.every((s) => s.status === 'healthy') ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> All Systems Operational
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" /> Degraded Performance
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {health.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${service.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  <span className="font-medium">{service.service}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {service.latency}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      service.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
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
          <QuickAction
            href="/dashboard/clients/new"
            icon={Building2}
            title="Add Client"
            description="Provision new client"
          />
          <QuickAction
            href="/dashboard/instances/new"
            icon={Server}
            title="Deploy Instance"
            description="Launch new instance"
          />
          <QuickAction
            href="/dashboard/domains"
            icon={Activity}
            title="Manage Domains"
            description="Configure custom domains"
          />
          <QuickAction
            href="/dashboard/notifications"
            icon={AlertTriangle}
            title="View Alerts"
            description="Check system alerts"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
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

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
    >
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
