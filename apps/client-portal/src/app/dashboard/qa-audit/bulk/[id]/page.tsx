'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
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
import { useCampaign } from '@/lib/hooks';

export default function CampaignDetailsPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId);

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
            <p className="text-muted-foreground">Failed to load campaign details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = campaign.totalJobs > 0
    ? Math.round(((campaign.completedJobs + campaign.failedJobs) / campaign.totalJobs) * 100)
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Failed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Processing</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Pending</Badge>;
    }
  };

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
            <h2 className="text-2xl font-bold tracking-tight">{campaign.name}</h2>
            <p className="text-muted-foreground">Campaign Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(campaign.status)}
          <span className="capitalize font-medium">{campaign.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{campaign.totalJobs}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-500">{campaign.completedJobs}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{campaign.failedJobs}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
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

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            Individual audit jobs in this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!campaign.jobs || campaign.jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-4" />
              <p>No job details available</p>
              <p className="text-sm">Job details will appear once the campaign starts processing</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audio URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.jobs.map((job, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{job.agentName || '-'}</TableCell>
                      <TableCell>{job.callId || '-'}</TableCell>
                      <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {job.audioUrl}
                      </TableCell>
                      <TableCell className="text-right">
                        {job.auditId && (
                          <Link href={`/dashboard/audits/${job.auditId}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {job.error && (
                          <span className="text-xs text-red-500" title={job.error}>
                            Error
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
