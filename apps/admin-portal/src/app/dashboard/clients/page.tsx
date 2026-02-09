'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Users,
  Server,
  Settings,
  Trash2,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { instanceApi, Instance } from '@/lib/api';

// Simplified client interface mapped from Instance
interface Client {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'pending' | 'suspended';
  users: number; // Placeholder as instance doesn't have user count yet
  auditsThisMonth: number; // Placeholder
  instanceId?: string;
  domain?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    slug: '',
    plan: 'starter',
    adminEmail: '',
  });
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const instances = await instanceApi.findAll();
      // Map instances to "Clients" view
      const mappedClients: Client[] = instances.map((inst) => ({
        id: inst._id,
        name: inst.name || 'Unnamed Client',
        slug: inst.domain?.subdomain || '',
        plan: (inst.plan as any) || 'pro',
        status:
          inst.status === 'running'
            ? 'active'
            : inst.status === 'provisioning'
              ? 'pending'
              : 'suspended',
        users: inst.usage?.activeUsers || 0,
        auditsThisMonth: inst.credits?.usedAudits || 0,
        instanceId: inst._id,
        domain:
          inst.domain?.customDomain ||
          `${inst.domain?.subdomain}.assureqai.com`,
        createdAt: new Date(inst.createdAt).toISOString().split('T')[0],
      }));
      setClients(mappedClients);
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;
    const matchesPlan = planFilter === 'all' || client.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await instanceApi.create({
        name: newClient.name,
        plan: newClient.plan,
        domain: { subdomain: newClient.slug },
        // In a real flow, checking admin email would trigger user creation too
      });
      await fetchClients(); // Refresh list
      setNewClient({ name: '', slug: '', plan: 'starter', adminEmail: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create client', error);
      alert('Failed to create client. Check console for details.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete client "${name}"? This will delete the associated instance and cannot be undone.`,
      )
    ) {
      return;
    }

    // Determine instance ID (in this mock view it's the same as client ID or mapped)
    // In real app, we might need to lookup instance ID differently if they differ
    const client = clients.find((c) => c.id === id);
    if (!client || !client.instanceId) return;

    setActionLoading(id);
    try {
      await instanceApi.delete(client.instanceId);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete client', error);
      alert('Failed to delete client');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-500';
      case 'pro':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'suspended':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Management</h2>
          <p className="text-muted-foreground">
            Manage client accounts and subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showAddForm ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">New Client</h3>
          <form
            onSubmit={handleCreateClient}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-medium">Company Name *</label>
              <input
                type="text"
                required
                value={newClient.name}
                onChange={(e) =>
                  setNewClient({ ...newClient, name: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <input
                type="text"
                required
                value={newClient.slug}
                onChange={(e) =>
                  setNewClient({
                    ...newClient,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="acme"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Plan</label>
              <select
                value={newClient.plan}
                onChange={(e) =>
                  setNewClient({ ...newClient, plan: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Email *</label>
              <input
                type="email"
                required
                value={newClient.adminEmail}
                onChange={(e) =>
                  setNewClient({ ...newClient, adminEmail: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="admin@company.com"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Client & Provision Instance
              </button>
            </div>
          </form>
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
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

      {/* Clients Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Client
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Users
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Audits/Mo
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Instance
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.domain}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPlanColor(client.plan)}`}
                    >
                      {client.plan}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">{client.users}</td>
                  <td className="text-center py-3 px-4">
                    {client.auditsThisMonth.toLocaleString()}
                  </td>
                  <td className="text-center py-3 px-4">
                    {client.instanceId ? (
                      <span className="font-mono text-xs">
                        {client.instanceId.substring(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`https://${client.domain}`}
                        target="_blank"
                        className="p-1.5 rounded hover:bg-muted transition-colors inline-flex items-center justify-center"
                        title="View Site"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      <Link
                        href={
                          client.instanceId
                            ? `/dashboard/instances/${client.instanceId}`
                            : '#'
                        }
                        className={`p-1.5 rounded hover:bg-muted transition-colors inline-flex items-center justify-center ${!client.instanceId && 'opacity-50 pointer-events-none'}`}
                        title="Settings"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteClient(client.id, client.name)
                        }
                        disabled={actionLoading === client.id}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        {actionLoading === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
