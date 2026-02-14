'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  CreditCard,
  Star,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import api, { CreditPlan, Payment } from '@/lib/api';

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Usage state
  const [usage, setUsage] = useState({
    auditsUsed: 0,
    auditsLimit: 0,
    tokensUsed: 0,
    tokensLimit: 0,
  });

  useEffect(() => {
    fetchPlans();
    fetchPayments();
    fetchUsage();

    // Handle success return from payment
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Payment Successful",
        description: "Your credits have been added to your account.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800",
      });
      // Clean up URL
      router.replace('/dashboard/billing');
    }
  }, [searchParams]);

  async function fetchPlans() {
    try {
      setLoadingPlans(true);
      const data = await api.creditPlan.listActive();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoadingPlans(false);
    }
  }

  async function fetchPayments() {
    try {
      setLoadingPayments(true);
      const data = await api.payment.list(20, 0);
      setPayments(data.payments);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function fetchUsage() {
    // Determine usage from instance status or audit stats
    try {
      const stats = await api.audit.getStats();
      // Improve this with actual quota API if available, effectively mock for now based on known limits
      setUsage({
        auditsUsed: stats.total || 0,
        auditsLimit: 100, // Default or fetched
        tokensUsed: stats.totalTokens || 0,
        tokensLimit: 100000,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePurchase(planId: string) {
    try {
      setProcessingId(planId);
      setError('');
      // Pass the current page URL as the return URL for Dodo Payments
      const returnUrl = window.location.origin + '/dashboard/billing';
      const { checkoutUrl } = await api.payment.createCheckout(planId, returnUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate checkout');
      setProcessingId(null);
    }
  }

  function formatPrice(amount: number, currency = 'USD') {
    if (currency === 'INR') {
      return `₹${(amount / 100).toLocaleString('en-IN')}`;
    }
    return `$${(amount / 100).toFixed(2)}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="container py-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, purchase credits, and view payment history.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Current Usage
            </CardTitle>
            <CardDescription>
              Your credit consumption for this billing period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Audit Credits</span>
                <span className="text-muted-foreground">
                  {usage.auditsUsed} / {usage.auditsLimit === 0 ? '∞' : usage.auditsLimit}
                </span>
              </div>
              <Progress value={usage.auditsLimit > 0 ? (usage.auditsUsed / usage.auditsLimit) * 100 : 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">AI Tokens</span>
                <span className="text-muted-foreground">
                  {usage.tokensUsed.toLocaleString()} / {usage.tokensLimit === 0 ? '∞' : usage.tokensLimit.toLocaleString()}
                </span>
              </div>
              <Progress value={usage.tokensLimit > 0 ? (usage.tokensUsed / usage.tokensLimit) * 100 : 0} className="h-2" />
            </div>

            <div className="pt-2">
              <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                Need more credits? Check out our top-up plans below.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Card (Placeholder for now) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-500" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your active subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">Free Tier</div>
            <p className="text-muted-foreground text-sm mb-4">
              You are currently on the free tier. Upgrade to Pro for advanced features and higher limits.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Manage Subscription (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Purchase Credits</h2>
            <p className="text-muted-foreground">Top up your account with one-time credit packages.</p>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">No active plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan._id} className={`flex flex-col relative overflow-hidden transition-all hover:border-indigo-300 ${plan.isFeatured ? 'border-indigo-500 shadow-md scale-[1.02]' : ''}`}>
                  {plan.isFeatured && (
                    <div className="absolute top-0 right-0 p-0">
                      <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        RECOMMENDED
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription className="mt-1">{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {formatPrice(plan.priceUsd)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        / one-time
                      </span>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 text-sm font-medium pt-2">
                        <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{plan.auditCredits} Audit Credits</span>
                      </div>
                      {plan.tokenCredits > 0 && (
                        <div className="flex gap-2 text-sm font-medium">
                          <Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>{plan.tokenCredits.toLocaleString()} AI Tokens</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.isFeatured ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                      onClick={() => handlePurchase(plan._id)}
                      disabled={!!processingId}
                    >
                      {processingId === plan._id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View your recent transactions and invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment history found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>
                          {typeof payment.creditPlanId === 'object' ? (payment.creditPlanId as any).name : 'Credit Purchase'}
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            ID: {payment.dodoPaymentId || payment._id.substring(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(payment.amount, payment.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            payment.status === 'completed' ? 'secondary' :
                              payment.status === 'pending' ? 'outline' : 'destructive'
                          } className={
                            payment.status === 'completed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''
                          }>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.invoiceUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Invoice
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
