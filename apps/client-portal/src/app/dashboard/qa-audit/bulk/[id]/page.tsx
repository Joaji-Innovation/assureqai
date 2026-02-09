'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  PlayCircle,
  PauseCircle,
  RotateCw,
  Settings,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useToast } from '@/hooks/use-toast';
import { campaignApi } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useCampaign } from '@/lib/hooks';

type JobFilter = 'all' | 'failed' | 'completed' | 'pending' | 'processing';

export default function CampaignDetailsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { toast } = useToast();
  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId);

  // State for config
  const [showSettings, setShowSettings] = useState(false);
  const [rpm, setRpm] = useState(10);
  const [failureThreshold, setFailureThreshold] = useState(20);

  // State for job interactions
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [retryingJobs, setRetryingJobs] = useState<Set<number>>(new Set());
  const [jobFilter, setJobFilter] = useState<JobFilter>('all');

  // Auto-poll when campaign is active
  useEffect(() => {
    if (!campaign) return;
    const isActive =
      campaign.status === 'processing' || campaign.status === 'pending';
    if (!isActive) return;

    const interval = setInterval(() => {
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [campaign?.status, refetch]);

  // Update local state when campaign loads
  useEffect(() => {
    if (campaign?.config) {
      setRpm(campaign.config.rpm || 10);
      setFailureThreshold(campaign.config.failureThreshold || 20);
    }
  }, [campaign]);

  const toggleJobExpanded = useCallback((index: number) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleRetryJob = useCallback(
    async (jobIndex: number) => {
      setRetryingJobs((prev) => new Set(prev).add(jobIndex));
      try {
        await campaignApi.retryJob(campaignId, jobIndex);
        toast({
          title: 'Job queued for retry',
          description: `Job #${jobIndex + 1} has been re-queued`,
        });
        refetch();
      } catch (e: any) {
        toast({
          title: 'Retry failed',
          description: e.message,
          variant: 'destructive',
        });
      } finally {
        setRetryingJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobIndex);
          return next;
        });
      }
    },
    [campaignId, toast, refetch],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/qa-audit/bulk">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-muted-foreground">
              Failed to load campaign details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent =
    campaign.totalJobs > 0
      ? Math.round(
          ((campaign.completedJobs + campaign.failedJobs) /
            campaign.totalJobs) *
            100,
        )
      : 0;

  const pendingJobs =
    campaign.totalJobs - campaign.completedJobs - campaign.failedJobs;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handlePause = async () => {
    try {
      await campaignApi.pause(campaignId);
      toast({ title: 'Campaign paused' });
      refetch();
    } catch (e: any) {
      toast({
        title: 'Failed to pause',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const handleResume = async () => {
    try {
      await campaignApi.resume(campaignId);
      toast({ title: 'Campaign resumed' });
      refetch();
    } catch (e: any) {
      toast({
        title: 'Failed to resume',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const handleRetryAll = async () => {
    try {
      await campaignApi.retry(campaignId);
      toast({ title: 'Retrying all failed jobs' });
      refetch();
    } catch (e: any) {
      toast({
        title: 'Failed to retry',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
          >
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/30"
          >
            Failed
          </Badge>
        );
      case 'processing':
        return (
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30"
          >
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Pending
          </Badge>
        );
    }
  };

  const handleSaveConfig = async () => {
    try {
      await campaignApi.updateConfig(campaignId, { rpm, failureThreshold });
      toast({
        title: 'Settings updated',
        description: 'Queue configuration saved',
      });
      setShowSettings(false);
      refetch();
    } catch (e: any) {
      toast({
        title: 'Failed to update settings',
        description: e.message,
        variant: 'destructive',
      });
    }
  };

  // Filter jobs
  const filteredJobs = (campaign.jobs || [])
    .map((job, idx) => ({ ...job, originalIndex: idx }))
    .filter((job) => jobFilter === 'all' || job.status === jobFilter);

  // Failure summary grouped by error message
  const failureSummary = (campaign.jobs || []).reduce(
    (acc, job) => {
      if (job.status === 'failed' && job.error) {
        const key = job.error;
        if (!acc[key]) acc[key] = 0;
        acc[key]++;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const failureReasons = Object.entries(failureSummary).sort(
    ([, a], [, b]) => b - a,
  );

  // Count by status for filter tabs
  const statusCounts = (campaign.jobs || []).reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/qa-audit/bulk">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {campaign.name}
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <p>Campaign Details</p>
              {(campaign.status === 'processing' ||
                campaign.status === 'pending') && (
                <>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className="text-xs font-normal bg-primary/5 text-primary border-primary/20"
                  >
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Live Polling
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Queue Settings
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Queue Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Speed (Audits per Minute)</Label>
                  <span className="text-xs text-muted-foreground">
                    {rpm} RPM
                  </span>
                </div>
                <Slider
                  min={1}
                  max={60}
                  step={1}
                  value={[rpm]}
                  onValueChange={(vals) => setRpm(vals[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Controls how fast jobs are processed. Lower this if you hit
                  API rate limits.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Pause on Failure %</Label>
                  <span className="text-xs text-muted-foreground">
                    {failureThreshold}%
                  </span>
                </div>
                <Slider
                  min={5}
                  max={100}
                  step={5}
                  value={[failureThreshold]}
                  onValueChange={(vals) => setFailureThreshold(vals[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-pause campaign if failure rate exceeds this threshold.
                </p>
              </div>

              <Button onClick={handleSaveConfig} disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Actions */}
      <div className="flex items-center gap-2">
        {(campaign.status === 'processing' ||
          campaign.status === 'pending') && (
          <Button variant="outline" size="sm" onClick={handlePause}>
            <PauseCircle className="mr-2 h-4 w-4" />
            Pause
          </Button>
        )}
        {campaign.status === 'paused' && (
          <Button variant="outline" size="sm" onClick={handleResume}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Resume
          </Button>
        )}
        {campaign.failedJobs > 0 && (
          <Button variant="outline" size="sm" onClick={handleRetryAll}>
            <RotateCw className="mr-2 h-4 w-4" />
            Retry All Failed ({campaign.failedJobs})
          </Button>
        )}
        <div className="flex items-center gap-2 ml-2">
          {getStatusIcon(campaign.status)}
          <span className="capitalize font-medium">
            {campaign.status.replace(/_/g, ' ')}
          </span>
          {campaign.status === 'paused' && campaign.failedJobs > 0 && (
            <span className="text-xs text-red-500 ml-1">
              (High failure rate detected)
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{campaign.totalJobs}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-500">
              {campaign.completedJobs}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">
              {campaign.failedJobs}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">
              {pendingJobs}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <div className="text-sm text-muted-foreground">Progress</div>
            <Progress value={progressPercent} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Failure Summary */}
      {failureReasons.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Failure Summary — {campaign.failedJobs} job
              {campaign.failedJobs !== 1 ? 's' : ''} failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failureReasons.map(([reason, count], i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-red-500/10"
                >
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground break-words">
                      {reason}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-500 border-red-500/20 shrink-0"
                  >
                    {count}x
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Jobs</CardTitle>
              <CardDescription>
                Individual audit jobs in this campaign
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground mr-1" />
              {(
                [
                  'all',
                  'failed',
                  'completed',
                  'pending',
                  'processing',
                ] as JobFilter[]
              ).map((filter) => {
                const count =
                  filter === 'all'
                    ? campaign.jobs?.length || 0
                    : statusCounts[filter] || 0;
                if (filter !== 'all' && count === 0) return null;
                return (
                  <Button
                    key={filter}
                    variant={jobFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setJobFilter(filter)}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    <span className="ml-1 opacity-70">({count})</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!campaign.jobs || campaign.jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-4" />
              <p>No job details available</p>
              <p className="text-sm">
                Job details will appear once the campaign starts processing
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No jobs match the selected filter</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => {
                    const idx = job.originalIndex;
                    const isExpanded = expandedJobs.has(idx);
                    const isRetrying = retryingJobs.has(idx);
                    const hasFailed = job.status === 'failed';

                    return (
                      <Fragment key={idx}>
                        <TableRow
                          className={
                            hasFailed
                              ? 'bg-red-500/[0.02] hover:bg-red-500/[0.05]'
                              : ''
                          }
                        >
                          <TableCell className="font-medium font-mono text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            {job.agentName || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {job.callId || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                          <TableCell>
                            {hasFailed && job.error ? (
                              <button
                                onClick={() => toggleJobExpanded(idx)}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                              >
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="max-w-[200px] truncate">
                                  {job.error}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 shrink-0" />
                                )}
                              </button>
                            ) : job.status === 'completed' && job.auditId ? (
                              <span className="text-xs text-emerald-500">
                                Audit created
                              </span>
                            ) : job.status === 'processing' ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />{' '}
                                Processing...
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Queued
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {hasFailed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isRetrying}
                                  onClick={() => handleRetryJob(idx)}
                                  className="text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                >
                                  {isRetrying ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <RotateCw className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Retry
                                </Button>
                              )}
                              {job.auditId && (
                                <Link href={`/dashboard/audits/${job.auditId}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    View
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Expanded error details */}
                        {isExpanded && hasFailed && job.error && (
                          <TableRow className="bg-red-500/[0.03]">
                            <TableCell colSpan={6} className="py-3">
                              <div className="ml-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                  <div className="space-y-1 min-w-0">
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                      Failure Reason
                                    </p>
                                    <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                                      {job.error}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-red-500/10 text-xs text-muted-foreground">
                                      <span>
                                        Audio:{' '}
                                        <span className="font-mono text-foreground/70 break-all">
                                          {job.audioUrl}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
