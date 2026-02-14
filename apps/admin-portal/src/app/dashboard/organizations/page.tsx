'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  CreditCard,
  ExternalLink,
  Loader2,
  Image,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { organizationApi, instanceApi, Organization, Instance } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  trial: 'bg-cyan-100 text-cyan-700',
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    companyName: '',
    contactEmail: '',
    phone: '',
    plan: 'free' as Organization['plan'],
    billingType: 'prepaid' as Organization['billingType'],
    status: 'active' as Organization['status'],
    instanceId: '',
    logo: '',
    brandColor: '#6366f1',
    notes: '',
  });

  useEffect(() => {
    fetchOrganizations();
    fetchInstances();
  }, [filterStatus, filterPlan, search]);

  async function fetchOrganizations() {
    try {
      setLoading(true);
      const data = await organizationApi.listWithStats();
      let filtered = data;
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.name.toLowerCase().includes(s) ||
            o.contactEmail.toLowerCase().includes(s) ||
            o.companyName?.toLowerCase().includes(s),
        );
      }
      setOrganizations(filtered);
    } catch (err: any) {
      showToast(err.message || 'Failed to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstances() {
    try {
      const data = await instanceApi.findAll();
      setInstances(data);
    } catch {
      // Silently fail — instances are for linking
    }
  }

  function resetForm() {
    setForm({
      name: '',
      slug: '',
      companyName: '',
      contactEmail: '',
      phone: '',
      plan: 'free',
      billingType: 'prepaid',
      status: 'active',
      instanceId: '',
      logo: '',
      brandColor: '#6366f1',
      notes: '',
    });
  }

  function openEdit(org: Organization) {
    setForm({
      name: org.name,
      slug: org.slug,
      companyName: org.companyName || '',
      contactEmail: org.contactEmail,
      phone: org.phone || '',
      plan: org.plan,
      billingType: org.billingType,
      status: org.status,
      instanceId: org.instanceId || '',
      logo: org.logo || '',
      brandColor: org.brandColor || '#6366f1',
      notes: org.notes || '',
    });
    setEditingOrg(org);
    setShowCreateModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingOrg) {
        await organizationApi.update(editingOrg._id, form as any);
        showToast('Organization updated', 'success');
      } else {
        await organizationApi.create(form as any);
        showToast('Organization created', 'success');
      }
      setShowCreateModal(false);
      setEditingOrg(null);
      resetForm();
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this organization? This cannot be undone.')) return;
    try {
      await organizationApi.delete(id);
      showToast('Organization deleted', 'success');
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Organizations
          </h1>
          <p className="text-gray-500 mt-1">
            Manage customer organizations, branding, and billing
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingOrg(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total',
            value: organizations.length,
            color: 'bg-indigo-50 text-indigo-700',
          },
          {
            label: 'Active',
            value: organizations.filter((o) => o.status === 'active').length,
            color: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Trial',
            value: organizations.filter((o) => o.status === 'trial').length,
            color: 'bg-cyan-50 text-cyan-700',
          },
          {
            label: 'Enterprise',
            value: organizations.filter((o) => o.plan === 'enterprise').length,
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center font-bold text-lg`}
            >
              {stat.value}
            </div>
            <span className="text-sm text-gray-600">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No organizations found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Organization
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Users
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Billing
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Created
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr
                  key={org._id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                          style={{
                            backgroundColor: org.brandColor || '#6366f1',
                          }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-400">
                          {org.contactEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${planColors[org.plan]}`}
                    >
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[org.status]}`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-3.5 h-3.5" />
                      {org.userCount || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600 capitalize text-xs">
                      {org.billingType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingOrg(org)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(org)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(org._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail View Modal */}
      {viewingOrg && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {viewingOrg.name}
              </h3>
              <button
                onClick={() => setViewingOrg(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 block">Slug</span>
                <span className="text-gray-900 font-mono">
                  {viewingOrg.slug}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Email</span>
                <span className="text-gray-900">{viewingOrg.contactEmail}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Plan</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[viewingOrg.plan]}`}
                >
                  {viewingOrg.plan}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[viewingOrg.status]}`}
                >
                  {viewingOrg.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Users</span>
                <span className="text-gray-900">
                  {viewingOrg.userCount || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Billing</span>
                <span className="text-gray-900 capitalize">
                  {viewingOrg.billingType}
                </span>
              </div>
              {viewingOrg.instance && (
                <>
                  <div className="col-span-2 pt-2 border-t">
                    <span className="text-gray-400 block mb-1">
                      Linked Instance
                    </span>
                    <span className="text-gray-900 font-medium">
                      {(viewingOrg.instance as any).name || 'Unknown'}
                    </span>
                  </div>
                </>
              )}
              {viewingOrg.notes && (
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-gray-400 block">Notes</span>
                  <span className="text-gray-700">{viewingOrg.notes}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setViewingOrg(null);
                  openEdit(viewingOrg);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingOrg ? 'Edit Organization' : 'New Organization'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingOrg(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                    placeholder="auto-generated"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        plan: e.target.value as Organization['plan'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing
                  </label>
                  <select
                    value={form.billingType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        billingType: e.target.value as Organization['billingType'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="postpaid">Postpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Organization['status'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    value={form.logo}
                    onChange={(e) =>
                      setForm({ ...form, logo: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.brandColor}
                      onChange={(e) =>
                        setForm({ ...form, brandColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <input
                      value={form.brandColor}
                      onChange={(e) =>
                        setForm({ ...form, brandColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Instance
                </label>
                <select
                  value={form.instanceId}
                  onChange={(e) =>
                    setForm({ ...form, instanceId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">— None —</option>
                  {instances.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name || inst._id} ({inst.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingOrg(null);
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {editingOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
