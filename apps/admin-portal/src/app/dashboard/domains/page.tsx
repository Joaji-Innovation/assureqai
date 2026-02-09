'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { instanceApi, Instance } from '@/lib/api';

// Derived domain interface for the UI
interface DomainUI {
  id: string; // Using instance ID for reference mostly
  domain: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'pending' | 'error'; // Mapped from instance/domain status
  sslStatus: 'valid' | 'pending' | 'expired';
  sslExpiry?: string;
  createdAt: string;
  isCustom: boolean;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // "Add Domain" technically means adding a custom domain to an existing instance
  // The current UI implies adding a standalone domain, but in this architecture, domains belong to instances.
  // I will adapt the form to "Add Custom Domain to Instance"
  const [showAddForm, setShowAddForm] = useState(false);

  // We need list of instances for the dropdown
  const [instances, setInstances] = useState<Instance[]>([]);

  const [newDomain, setNewDomain] = useState({ domain: '', instanceId: '' });
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const allInstances = await instanceApi.findAll();
      setInstances(allInstances);

      const mappedDomains: DomainUI[] = [];

      allInstances.forEach((inst) => {
        // Add Subdomain entry
        if (inst.domain?.subdomain) {
          mappedDomains.push({
            id: `${inst._id}-sub`,
            domain: `${inst.domain.subdomain}.assureqai.com`,
            clientId: inst._id,
            clientName: inst.name || 'Unnamed Client',
            status: 'active', // Subdomains are always active if instance exists
            sslStatus: 'valid', // Wildcard SSL usually
            createdAt: new Date(inst.createdAt).toISOString().split('T')[0],
            isCustom: false,
          });
        }

        // Add Custom Domain entry if exists
        if (inst.domain?.customDomain) {
          mappedDomains.push({
            id: `${inst._id}-custom`,
            domain: inst.domain.customDomain,
            clientId: inst._id,
            clientName: inst.name || 'Unnamed Client',
            status: inst.domain?.customDomainVerified ? 'active' : 'pending',
            sslStatus: inst.domain?.sslStatus || 'pending',
            createdAt: new Date(inst.createdAt).toISOString().split('T')[0], // Approximation
            isCustom: true,
          });
        }
      });

      setDomains(mappedDomains);
    } catch (error) {
      console.error('Failed to fetch domains', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = domains.filter(
    (domain) =>
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.instanceId) return;

    setAdding(true);
    try {
      await instanceApi.addCustomDomain(newDomain.instanceId, newDomain.domain);
      await fetchData();
      setNewDomain({ domain: '', instanceId: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add domain', error);
      alert('Failed to add custom domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (id: string) => {
    // ID is like "instanceId-custom"
    const instanceId = id.split('-')[0];
    setVerifying(id);
    try {
      const result = await instanceApi.verifyDomain(instanceId);
      if (result.verified) {
        setDomains((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: 'active', sslStatus: 'valid' } : d,
          ),
        );
      } else {
        alert(
          result.error ||
            'Domain verification failed. Please check DNS settings.',
        );
      }
    } catch (error) {
      console.error('Verification failed', error);
      alert('Failed to verify domain');
    } finally {
      setVerifying(null);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to remove this custom domain?')) return;

    const instanceId = id.split('-')[0];
    try {
      await instanceApi.removeDomain(instanceId);
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Failed to remove domain', error);
      alert('Failed to remove custom domain');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'error':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSslColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-emerald-500';
      case 'pending':
        return 'text-amber-500';
      case 'expired':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Domain Management</h2>
          <p className="text-muted-foreground">
            Configure custom domains and SSL certificates
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
          {showAddForm ? 'Cancel' : 'Add Custom Domain'}
        </button>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <div className="bg-card/50 backdrop-blur rounded-xl border border-primary/50 p-6">
          <h3 className="text-lg font-semibold mb-4">
            Add Custom Domain to Instance
          </h3>
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Domain *</label>
                <input
                  type="text"
                  required
                  value={newDomain.domain}
                  onChange={(e) =>
                    setNewDomain({ ...newDomain, domain: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="qa.example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Instance (Client) *
                </label>
                <select
                  value={newDomain.instanceId}
                  onChange={(e) =>
                    setNewDomain({ ...newDomain, instanceId: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select instance...</option>
                  {instances.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.domain?.subdomain})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="text-sm font-medium mb-2">
                DNS Configuration Required
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Add the following CNAME record to your DNS:
              </p>
              <code className="block p-2 bg-background rounded text-xs font-mono">
                {newDomain.domain || 'your-domain.com'} CNAME
                proxy.assureqai.com
              </code>
            </div>
            <button
              type="submit"
              disabled={adding || !newDomain.instanceId}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Domain
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Domains Table */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center flex justify-center">
            <Loader2 className="animate-spin h-6 w-6" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Domain
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  Client/Instance
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  SSL
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((domain) => (
                <tr
                  key={domain.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary flex items-center gap-1"
                        >
                          {domain.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">
                          Created {domain.createdAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{domain.clientName}</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {domain.isCustom ? 'Custom' : 'Subdomain'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(domain.status)}`}
                    >
                      {domain.status}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`flex items-center justify-center gap-1 ${getSslColor(domain.sslStatus)}`}
                    >
                      {domain.sslStatus === 'valid' && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {domain.sslStatus === 'pending' && (
                        <Clock className="h-4 w-4" />
                      )}
                      {domain.sslStatus === 'expired' && (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {domain.sslStatus}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {domain.isCustom && domain.status !== 'active' && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id)}
                          disabled={verifying === domain.id}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {verifying === domain.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Verify
                        </button>
                      )}
                      {domain.isCustom && (
                        <button
                          onClick={() => handleDeleteDomain(domain.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
