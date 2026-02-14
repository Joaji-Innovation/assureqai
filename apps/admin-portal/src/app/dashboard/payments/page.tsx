'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ExternalLink,
  Loader2,
  DollarSign,
  Download,
} from 'lucide-react';
import { paymentApi, Payment } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-indigo-100 text-indigo-700',
  expired: 'bg-gray-100 text-gray-700',
};

const statusIcons: Record<string, any> = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
  refunded: RotateCcw,
  expired: Clock,
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [page, filterStatus]);

  async function fetchPayments() {
    try {
      setLoading(true);
      const data = await paymentApi.list({
        limit,
        skip: (page - 1) * limit,
        status: filterStatus || undefined,
      });
      setPayments(data.payments);
      setTotal(data.total);
    } catch (err: any) {
      toast(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(amount: number, currency: string) {
    if (currency === 'INR') {
      return `₹${(amount / 100).toLocaleString('en-IN')}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  async function handleManualComplete(id: string) {
    if (!window.confirm('Manually mark this payment as completed? This will grant credits.')) return;
    try {
      await paymentApi.manualComplete(id);
      toast('Payment marked as completed', 'success');
      fetchPayments();
      setSelectedPayment(null);
    } catch (err: any) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Payments
          </h1>
          <p className="text-gray-500 mt-1">
            Transaction history and status from Dodo Payments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchPayments()}
            className="px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Status:
        </label>
        <div className="flex gap-2">
          {['', 'completed', 'pending', 'failed', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Payment ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Plan / Item
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Date
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const StatusIcon = statusIcons[payment.status] || Clock;
                return (
                  <tr
                    key={payment._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {payment.dodoPaymentId ? (
                        <span className="flex items-center gap-1">
                          <img src="/dodo-icon.png" alt="Dodo" className="w-3 h-3 opacity-50" onError={(e) => (e.currentTarget.src = '')} />
                          {payment.dodoPaymentId.substring(0, 8)}...
                        </span>
                      ) : (
                        payment._id.substring(0, 8)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {typeof payment.organizationId === 'object'
                          ? (payment.organizationId as any).name
                          : 'Unknown Org'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {typeof payment.organizationId === 'object'
                          ? (payment.organizationId as any).contactEmail
                          : payment.userId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {typeof payment.creditPlanId === 'object'
                        ? (payment.creditPlanId as any).name
                        : 'Credit Purchase'}
                      <div className="text-xs text-gray-400">
                        {payment.auditCreditsGranted > 0 && `${payment.auditCreditsGranted} Audits`}
                        {payment.tokenCreditsGranted > 0 && `, ${payment.tokenCreditsGranted} Tokens`}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatPrice(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{payment.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(payment);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} payments
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded bg-white text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded bg-white text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Payment Details
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[selectedPayment.status]}`}>
                  {selectedPayment.status}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Customer</span>
                    <div className="font-medium text-gray-900">
                      {typeof selectedPayment.organizationId === 'object' ? (selectedPayment.organizationId as any).name : 'Unknown'}
                    </div>
                    <div className="text-gray-500">
                      {typeof selectedPayment.organizationId === 'object' ? (selectedPayment.organizationId as any).contactEmail : selectedPayment.userId}
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Dodo ID</span>
                    <div className="font-mono text-gray-700 break-all">
                      {selectedPayment.dodoPaymentId || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <span className="block text-gray-500 text-xs uppercase tracking-wider mb-2">Item Details</span>
                  <div className="flex justify-between mb-1">
                    <span>Plan:</span>
                    <span className="font-medium">
                      {typeof selectedPayment.creditPlanId === 'object' ? (selectedPayment.creditPlanId as any).name : 'Custom Credit Purchase'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Credits Granted:</span>
                    <span className="text-indigo-600 font-medium">
                      {selectedPayment.auditCreditsGranted} audits
                      {selectedPayment.tokenCreditsGranted > 0 && `, ${selectedPayment.tokenCreditsGranted} tokens`}
                    </span>
                  </div>
                </div>

                {selectedPayment.failureReason && (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-sm">
                    <span className="font-medium block mb-1">Failure Reason:</span>
                    {selectedPayment.failureReason}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 gap-3">
                {selectedPayment.status === 'pending' && (
                  <button
                    onClick={() => handleManualComplete(selectedPayment._id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
