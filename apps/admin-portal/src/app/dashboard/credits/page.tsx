'use client';

import { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';

interface InstanceCredits {
  id: string;
  instanceId: string;
  instanceName: string;
  instanceType: 'trial' | 'standard' | 'enterprise';
  auditCredits: { balance: number; used: number; total: number };
  tokenCredits: { balance: number; used: number; total: number };
  trialExpiresAt?: string;
}

interface Transaction {
  id: string;
  type: 'add' | 'use';
  creditType: 'audit' | 'token';
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<InstanceCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCredits, setAddingCredits] = useState<{
    type: 'audit' | 'token';
    instanceId: string;
  } | null>(null);
  const [addAmount, setAddAmount] = useState(100);
  const [addReason, setAddReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch credits data on mount
  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const instances = await api.instance.findAll();
      const mappedCredits: InstanceCredits[] = instances.map((inst: any) => ({
        id: inst._id,
        instanceId: inst.clientId, // Showing clientId as instanceId
        instanceName: inst.name,
        instanceType: inst.plan || 'standard',
        auditCredits: {
          balance:
            (inst.credits?.totalAudits || 0) - (inst.credits?.usedAudits || 0),
          used: inst.credits?.usedAudits || 0,
          total: inst.credits?.totalAudits || 0,
        },
        tokenCredits: {
          balance:
            (inst.credits?.totalTokens || 0) - (inst.credits?.usedTokens || 0),
          used: inst.credits?.usedTokens || 0,
          total: inst.credits?.totalTokens || 0,
        },
        trialExpiresAt: inst.trialExpiresAt,
      }));
      setCredits(mappedCredits);
    } catch (error) {
      console.error('Failed to fetch credits', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCredits = credits.filter((c) =>
    c.instanceName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddCredits = async () => {
    if (!addingCredits || !addReason.trim()) return;
    setProcessing(true);

    try {
      if (addingCredits.type === 'audit') {
        await api.credits.addAuditCredits(addingCredits.instanceId, {
          amount: addAmount,
          reason: addReason,
        });
      } else {
        await api.credits.addTokenCredits(addingCredits.instanceId, {
          amount: addAmount,
          reason: addReason,
        });
      }
      // Refresh data
      await fetchCredits();

      setAddingCredits(null);
      setAddAmount(100);
      setAddReason('');
    } catch (error) {
      console.error('Failed to add credits', error);
      alert('Failed to add credits');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trial':
        return 'bg-amber-500/10 text-amber-500';
      case 'standard':
        return 'bg-blue-500/10 text-blue-500';
      case 'enterprise':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPercentage = (balance: number, total: number) => {
    return total > 0 ? Math.round((balance / total) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-emerald-500';
    if (percentage > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const stats = {
    totalInstances: credits.length,
    trialInstances: credits.filter((c) => c.instanceType === 'trial').length,
    lowCredit: credits.filter(
      (c) => getPercentage(c.auditCredits.balance, c.auditCredits.total) < 20,
    ).length,
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Credits Management</h2>
          <p className="text-muted-foreground">
            Manage audit and token credits for instances
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Instances</p>
              <p className="text-2xl font-bold">{stats.totalInstances}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-amber-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Trial</p>
              <p className="text-2xl font-bold text-amber-500">
                {stats.trialInstances}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur rounded-xl border border-red-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Coins className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Credits</p>
              <p className="text-2xl font-bold text-red-500">
                {stats.lowCredit}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search instances..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Credits List */}
      <div className="space-y-4">
        {filteredCredits.map((instance) => {
          const auditPercent = getPercentage(
            instance.auditCredits.balance,
            instance.auditCredits.total,
          );
          const tokenPercent = getPercentage(
            instance.tokenCredits.balance,
            instance.tokenCredits.total,
          );

          return (
            <div
              key={instance.id}
              className="bg-card/50 backdrop-blur rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{instance.instanceName}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full ${getTypeColor(instance.instanceType)}`}
                      >
                        {instance.instanceType}
                      </span>
                      {instance.trialExpiresAt && (
                        <span className="text-muted-foreground">
                          Expires:{' '}
                          {new Date(
                            instance.trialExpiresAt,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Audit Credits */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Audit Credits</span>
                    <button
                      onClick={() =>
                        setAddingCredits({
                          type: 'audit',
                          instanceId: instance.id,
                        })
                      }
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold">
                      {instance.auditCredits.balance.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {instance.auditCredits.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(auditPercent)} transition-all`}
                      style={{ width: `${auditPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {instance.auditCredits.used.toLocaleString()} used (
                    {auditPercent}% remaining)
                  </p>
                </div>

                {/* Token Credits */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Token Credits</span>
                    <button
                      onClick={() =>
                        setAddingCredits({
                          type: 'token',
                          instanceId: instance.id,
                        })
                      }
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold">
                      {(instance.tokenCredits.balance / 1000).toFixed(0)}K
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {(instance.tokenCredits.total / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(tokenPercent)} transition-all`}
                      style={{ width: `${tokenPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(instance.tokenCredits.used / 1000).toFixed(0)}K used (
                    {tokenPercent}% remaining)
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Credits Modal */}
      {addingCredits && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Add {addingCredits.type === 'audit' ? 'Audit' : 'Token'} Credits
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <input
                  type="number"
                  min="1"
                  value={addAmount}
                  onChange={(e) => setAddAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason *</label>
                <input
                  type="text"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Monthly top-up, Bonus allocation"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddCredits}
                disabled={processing || !addReason.trim() || addAmount <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Credits
              </button>
              <button
                onClick={() => {
                  setAddingCredits(null);
                  setAddReason('');
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
