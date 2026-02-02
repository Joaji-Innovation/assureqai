'use client';

import { useState, useCallback, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
  PlayCircle,
  Eye,
  Trash2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCampaigns, useCreateCampaign } from '@/lib/hooks';
import { qaParameterApi, type QAParameter, type Campaign } from '@/lib/api';

interface ParsedRow {
  audioUrl: string;
  agentName?: string;
  callId?: string;
  [key: string]: string | undefined;
}

export default function BulkAuditPage() {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState('Bulk QA Campaign');
  const [selectedQaParameterSetId, setSelectedQaParameterSetId] = useState<string>('');
  const [availableQaParameterSets, setAvailableQaParameterSets] = useState<QAParameter[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // React Query hooks
  const { data: campaignsData, isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useCampaigns(1, 50);
  const createCampaignMutation = useCreateCampaign();

  const campaigns = campaignsData?.data || [];
  const parsedPreview = useMemo(() => rows.slice(0, 5), [rows]);

  // Fetch QA Parameter Sets on mount
  useEffect(() => {
    qaParameterApi.list().then((params) => {
      setAvailableQaParameterSets(params);
      if (params.length > 0 && !selectedQaParameterSetId) {
        setSelectedQaParameterSetId(params[0]._id);
      }
    }).catch((err) => {
      console.error('Failed to fetch QA parameters', err);
    });
  }, []);

  // Poll for campaign updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCampaigns();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchCampaigns]);

  // Normalize CSV row to expected format
  const normalizeRow = (row: Record<string, string>): ParsedRow | null => {
    const audioUrl = row['(S3) recording_url'] || row['recording_url'] || row['recordingUrl'] || row['audioUrl'] || row['audio_url'];
    if (!audioUrl) return null;

    return {
      audioUrl,
      agentName: row['Full_Name'] || row['full_name'] || row['agentName'] || row['agent_name'] || '',
      callId: row['RID-Phone #'] || row['rid_phone'] || row['callId'] || row['call_id'] || '',
    };
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = (results.data || [])
          .map(normalizeRow)
          .filter((row): row is ParsedRow => row !== null);

        setRows(parsedRows);

        if (results.errors && results.errors.length > 0) {
          toast({
            title: 'CSV loaded with warnings',
            description: results.errors[0].message,
          });
        } else {
          toast({
            title: 'CSV loaded',
            description: `${parsedRows.length} rows parsed successfully`,
          });
        }
      },
      error: (error) => {
        toast({
          title: 'CSV error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        // Create a fake event to reuse handleFile
        const fakeEvent = {
          target: { files: e.dataTransfer.files }
        } as unknown as ChangeEvent<HTMLInputElement>;
        handleFile(fakeEvent);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
      }
    }
  };

  const startCampaign = async () => {
    if (!rows.length) {
      toast({ title: 'Upload a CSV first', variant: 'destructive' });
      return;
    }
    if (!selectedQaParameterSetId) {
      toast({ title: 'Select a QA Parameter Set', variant: 'destructive' });
      return;
    }

    try {
      await createCampaignMutation.mutateAsync({
        name: campaignName,
        qaParameterSetId: selectedQaParameterSetId,
        jobs: rows.map(row => ({
          audioUrl: row.audioUrl,
          agentName: row.agentName,
          callId: row.callId,
        })),
      });

      toast({
        title: 'Campaign started',
        description: `${rows.length} jobs queued for processing`,
      });
      setRows([]);
      refetchCampaigns();
    } catch (err: any) {
      toast({
        title: 'Failed to start campaign',
        description: err.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const progressFor = (c: Campaign) => {
    const done = c.completedJobs + c.failedJobs;
    if (!c.totalJobs) return 0;
    return Math.round((done / c.totalJobs) * 100);
  };

  const statusLabel = (status: string) => status.replace(/_/g, ' ');

  const completedCount = rows.filter((r) => r.audioUrl).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk AI Audit</h2>
          <p className="text-muted-foreground">Process multiple recordings at once using CSV upload</p>
        </div>
        {campaigns.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {campaigns.filter(c => c.status === 'completed').length} / {campaigns.length} campaigns completed
          </div>
        )}
      </div>

      {/* Campaign Setup Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Campaign Setup
          </CardTitle>
          <CardDescription>
            Upload a CSV file with recording URLs and configure your audit campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="space-y-2">
              <Label>QA Parameter Set</Label>
              <Select
                value={selectedQaParameterSetId}
                onValueChange={setSelectedQaParameterSetId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameters" />
                </SelectTrigger>
                <SelectContent>
                  {availableQaParameterSets.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CSV Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">Upload CSV File</p>
            <p className="text-sm text-muted-foreground mb-3">
              Drag & drop or click to select a CSV file with recording URLs
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="sm">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Select CSV
              </Button>
              <a
                href="/samples/bulk-audit-sample.csv"
                download
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-primary hover:underline"
              >
                Download sample CSV
              </a>
            </div>
          </div>

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Preview (first 5 rows)</div>
                <div className="text-sm text-muted-foreground">{rows.length} rows ready</div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Call ID</TableHead>
                      <TableHead>Recording URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.agentName || '-'}</TableCell>
                        <TableCell>{row.callId || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate text-blue-600">
                          {row.audioUrl}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {rows.length ? `${rows.length} rows ready to process` : 'No rows loaded'}
            </div>
            <Button
              onClick={startCampaign}
              disabled={createCampaignMutation.isPending || !rows.length || !selectedQaParameterSetId}
            >
              {createCampaignMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Start Campaign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            View and manage your bulk audit campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCampaigns ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-4" />
              <p>No campaigns yet</p>
              <p className="text-sm">Upload a CSV and start your first campaign</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            c.status === 'processing' || c.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                              c.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                c.status === 'cancelled' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-muted text-muted-foreground'
                          }`}>
                          {statusLabel(c.status)}
                        </span>
                      </TableCell>
                      <TableCell className="w-48">
                        <Progress value={progressFor(c)} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {c.completedJobs + c.failedJobs} / {c.totalJobs}
                          {c.failedJobs > 0 && (
                            <span className="text-red-500 ml-1">({c.failedJobs} failed)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/qa-audit/bulk/${c._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </div>
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
