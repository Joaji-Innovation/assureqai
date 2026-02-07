'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Server,
  Loader2,
  Save,
  ExternalLink,
  Users,
  HardDrive,
  FileText,
  Coins,
  Activity,
  Key,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { instanceApi, Instance } from '@/lib/api';
import Link from 'next/link';

export default function InstanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instanceId = params.id as string;

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);

  // Editable fields
  const [limits, setLimits] = useState({ maxUsers: 0, maxStorage: '10' });
  const [credits, setCredits] = useState({ totalAudits: 0, totalTokens: 0 });

  useEffect(() => {
    fetchInstance();
  }, [instanceId]);

  const fetchInstance = async () => {
    try {
      const data = await instanceApi.findAll();
      const found = data.find((i: Instance) => i._id === instanceId);
      if (found) {
        setInstance(found);
        setLimits({
          maxUsers: found.limits?.maxUsers || 50,
          maxStorage: found.limits?.maxStorage || '10',
        });
        setCredits({
          totalAudits: found.credits?.totalAudits || 0,
          totalTokens: found.credits?.totalTokens || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch instance', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async () => {
    if (!instance) return;
    setSaving(true);
    try {
      const updated = await instanceApi.updateLimits(instance._id, limits);
      setInstance(updated);
    } catch (error) {
      console.error('Failed to update limits', error);
      alert('Failed to update limits');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredits = async () => {
    if (!instance) return;
    setSaving(true);
    try {
      const updated = await instanceApi.updateCredits(instance._id, credits);
      setInstance(updated);
    } catch (error) {
      console.error('Failed to update credits', error);
      alert('Failed to update credits');
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = async () => {
    if (instance?.apiKey) {
      await navigator.clipboard.writeText(instance.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const regenerateApiKey = async () => {
    if (!instance || !confirm('Regenerate API key? The old key will stop working immediately.')) return;
    setRegeneratingKey(true);
    try {
      const result = await instanceApi.regenerateApiKey(instance._id);
      setInstance({ ...instance, apiKey: result.apiKey });
    } catch (error) {
      console.error('Failed to regenerate API key', error);
    } finally {
      setRegeneratingKey(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'suspended':
        return 'bg-red-500/10 text-red-500';
      case 'provisioning':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-500';
      case 'standard':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-amber-500/10 text-amber-500';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Instance not found</h2>
        <Link href="/dashboard/instances">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Back to Instances
          </button>
        </Link>
      </div>
    );
  }

  const usedAudits = instance.credits?.usedAudits || 0;
  const usedTokens = instance.credits?.usedTokens || 0;
  const apiCalls = instance.credits?.totalApiCalls || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/instances">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{instance.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(instance.status)}`}>
                  {instance.status}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getPlanColor(instance.plan || 'trial')}`}>
                  {instance.plan || 'trial'}
                </span>
                {instance.domain?.subdomain && (
                  <a
                    href={`https://${instance.domain.customDomain || instance.domain.subdomain + '.assureqai.com'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {instance.domain.customDomain || `${instance.domain.subdomain}.assureqai.com`}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Audits Used</p>
              <p className="text-xl font-bold">{usedAudits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Coins className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens Used</p>
              <p className="text-xl font-bold">{(usedTokens / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">API Calls</p>
              <p className="text-xl font-bold">{apiCalls.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing Type</p>
              <p className="text-xl font-bold capitalize">{instance.credits?.billingType || 'prepaid'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Limits Configuration */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Instance Limits
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Max Users</label>
              <input
                type="number"
                value={limits.maxUsers}
                onChange={(e) => setLimits({ ...limits, maxUsers: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Storage (GB)</label>
              <input
                type="text"
                value={limits.maxStorage}
                onChange={(e) => setLimits({ ...limits, maxStorage: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSaveLimits}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Limits
            </button>
          </div>
        </div>

        {/* Credits Configuration */}
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credit Allocations
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Total Audit Credits</label>
              <input
                type="number"
                value={credits.totalAudits}
                onChange={(e) => setCredits({ ...credits, totalAudits: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">Used: {usedAudits} / {credits.totalAudits}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Total Token Credits</label>
              <input
                type="number"
                value={credits.totalTokens}
                onChange={(e) => setCredits({ ...credits, totalTokens: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">Used: {(usedTokens / 1000).toFixed(0)}K / {(credits.totalTokens / 1000).toFixed(0)}K</p>
            </div>
            <button
              onClick={handleSaveCredits}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Credits
            </button>
          </div>
        </div>
      </div>

      {/* API Key Management */}
      <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key
        </h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
            {instance.apiKey || 'No API key generated'}
          </code>
          {instance.apiKey && (
            <>
              <button
                onClick={copyApiKey}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copy API Key"
              >
                {copiedKey ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={regenerateApiKey}
                disabled={regeneratingKey}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate API Key"
              >
                <RefreshCw className={`h-5 w-5 text-muted-foreground ${regeneratingKey ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use this API key for authentication when making API calls from this instance.
        </p>
      </div>
    </div>
  );
}
