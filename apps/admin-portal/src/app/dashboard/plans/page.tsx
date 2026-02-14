'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  Zap,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Hash,
} from 'lucide-react';
import { creditPlanApi, CreditPlan } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const typeColors: Record<string, string> = {
  audit: 'bg-blue-100 text-blue-700',
  token: 'bg-purple-100 text-purple-700',
  combo: 'bg-amber-100 text-amber-700',
};

export default function PlansPage() {
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CreditPlan | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    creditType: 'audit' as CreditPlan['creditType'],
    auditCredits: 100,
    tokenCredits: 0,
    priceUsd: 2900,
    priceInr: 240000,
    dodoProductId: '',
    sortOrder: 0,
    isFeatured: false,
    isPopular: false,
    features: [''],
    validityDays: 0,
    maxPurchasePerMonth: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      setLoading(true);
      const data = await creditPlanApi.list();
      setPlans(data);
    } catch (err: any) {
      toast(err.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: '',
      description: '',
      creditType: 'audit',
      auditCredits: 100,
      tokenCredits: 0,
      priceUsd: 2900,
      priceInr: 240000,
      dodoProductId: '',
      sortOrder: 0,
      isFeatured: false,
      isPopular: false,
      features: [''],
      validityDays: 0,
      maxPurchasePerMonth: 0,
    });
  }

  function openEdit(plan: CreditPlan) {
    setForm({
      name: plan.name,
      description: plan.description || '',
      creditType: plan.creditType,
      auditCredits: plan.auditCredits,
      tokenCredits: plan.tokenCredits,
      priceUsd: plan.priceUsd,
      priceInr: plan.priceInr || 0,
      dodoProductId: plan.dodoProductId || '',
      sortOrder: plan.sortOrder,
      isFeatured: plan.isFeatured,
      isPopular: plan.isPopular,
      features:
        plan.features.length > 0 ? [...plan.features] : [''],
      validityDays: plan.validityDays || 0,
      maxPurchasePerMonth: plan.maxPurchasePerMonth || 0,
    });
    setEditingPlan(plan);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      features: form.features.filter((f) => f.trim()),
      validityDays: form.validityDays || undefined,
      maxPurchasePerMonth: form.maxPurchasePerMonth || undefined,
      dodoProductId: form.dodoProductId || undefined,
    };
    try {
      if (editingPlan) {
        await creditPlanApi.update(editingPlan._id, payload as any);
        toast('Plan updated', 'success');
      } else {
        await creditPlanApi.create(payload as any);
        toast('Plan created', 'success');
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    }
  }

  async function handleToggle(id: string) {
    try {
      await creditPlanApi.toggleActive(id);
      fetchPlans();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await creditPlanApi.delete(id);
      toast('Plan deleted', 'success');
      fetchPlans();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  }

  function formatPrice(cents: number, currency = 'USD') {
    if (currency === 'INR') {
      return `₹${(cents / 100).toLocaleString('en-IN')}`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  function addFeature() {
    setForm({ ...form, features: [...form.features, ''] });
  }

  function updateFeature(index: number, value: string) {
    const updated = [...form.features];
    updated[index] = value;
    setForm({ ...form, features: updated });
  }

  function removeFeature(index: number) {
    setForm({
      ...form,
      features: form.features.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            Credit Plans
          </h1>
          <p className="text-gray-500 mt-1">
            Manage credit packages available for purchase.
            {plans.length === 0 && !loading && (
              <span className="text-amber-600 ml-1">
                Default plan ($29/100 credits) is active.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPlan(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Default Plan Info */}
      {plans.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>No plans configured.</strong> A default plan of{' '}
          <strong>$29 for 100 audit credits</strong> is automatically shown to
          customers. Create custom plans to replace it.
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`bg-white rounded-xl border-2 p-5 space-y-4 relative transition ${plan.isActive
                  ? plan.isFeatured
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : 'border-gray-100'
                  : 'border-gray-100 opacity-60'
                }`}
            >
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[plan.creditType]}`}
                >
                  {plan.creditType}
                </span>
                {plan.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                )}
                {plan.isPopular && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Popular
                  </span>
                )}
                {!plan.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                    Inactive
                  </span>
                )}
              </div>

              {/* Plan Name & Price */}
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(plan.priceUsd)}
                </span>
                {plan.priceInr && plan.priceInr > 0 && (
                  <span className="text-sm text-gray-400 ml-2">
                    / {formatPrice(plan.priceInr, 'INR')}
                  </span>
                )}
              </div>

              {/* Credits */}
              <div className="flex gap-4 text-sm">
                {plan.auditCredits > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Hash className="w-4 h-4" />
                    {plan.auditCredits} audits
                  </div>
                )}
                {plan.tokenCredits > 0 && (
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <Hash className="w-4 h-4" />
                    {plan.tokenCredits.toLocaleString()} tokens
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features.length > 0 && (
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {/* Dodo Product ID */}
              {plan.dodoProductId && (
                <div className="text-xs text-gray-400 font-mono truncate">
                  Dodo: {plan.dodoProductId}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <button
                  onClick={() => handleToggle(plan._id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600"
                >
                  {plan.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                  {plan.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'New Credit Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPlan(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="e.g. Starter Pack"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={form.creditType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        creditType: e.target.value as CreditPlan['creditType'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="audit">Audit</option>
                    <option value="token">Token</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audit Credits
                  </label>
                  <input
                    type="number"
                    value={form.auditCredits}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        auditCredits: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Credits
                  </label>
                  <input
                    type="number"
                    value={form.tokenCredits}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tokenCredits: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price USD (cents) *
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      value={form.priceUsd}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priceUsd: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      = {formatPrice(form.priceUsd)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price INR (paise)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={form.priceInr}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priceInr: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      = {formatPrice(form.priceInr, 'INR')}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dodo Product ID
                </label>
                <input
                  value={form.dodoProductId}
                  onChange={(e) =>
                    setForm({ ...form, dodoProductId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  placeholder="After creating product in Dodo dashboard"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        setForm({ ...form, isFeatured: e.target.checked })
                      }
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    Featured
                  </label>
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={(e) =>
                        setForm({ ...form, isPopular: e.target.checked })
                      }
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    Popular badge
                  </label>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features
                </label>
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={(e) => updateFeature(i, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="e.g. Real-time scoring"
                      />
                      {form.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-red-400 hover:text-red-600 px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    + Add feature
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
